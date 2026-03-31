import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, require_active_sub
from app.models.user import User
from app.schemas.common import TaskOut
from app.schemas.task import TaskCreate, TaskListResponse, TaskUpdate
from app.services.business_service import BusinessService
from app.services.task_service import TaskService
from app.utils.permissions import (
    can_delete_tasks,
    can_manage_all_tasks,
    can_manage_own_tasks,
    can_view_all_tasks,
    can_view_own_tasks,
)

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
    lead_id: uuid.UUID | None = Query(default=None),
    state: str = Query(default="open", pattern="^(open|done|overdue|all)$"),
    assigned_to: uuid.UUID | None = Query(default=None),
) -> TaskListResponse:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_task_access = can_view_all_tasks(role, custom_permissions)
    own_task_access = can_view_own_tasks(role, custom_permissions)
    if role == "observer" and not full_task_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot access tasks.")
    if role == "member" and not own_task_access and not full_task_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to tasks.")
    items = await TaskService(db).list_tasks_filtered(
        business_id=business_id,
        lead_id=lead_id,
        state=state,
        assigned_to=assigned_to,
        visible_user_id=current_user.id if role == "member" and not full_task_access else None,
    )
    return TaskListResponse(items=[TaskOut.model_validate(item) for item in items])


@router.post("", response_model=TaskOut)
async def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    if payload.business_id != business_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="business_id mismatch")
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_task_access = can_manage_all_tasks(role, custom_permissions)
    own_task_access = can_manage_own_tasks(role, custom_permissions)
    if role == "observer" and not full_task_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot create tasks.")
    if role == "member" and not own_task_access and not full_task_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create tasks.")
    if role == "member" and not full_task_access and payload.assigned_to not in {None, current_user.id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only create tasks for themselves.")
    task = await TaskService(db).create_task(current_user.id, payload)
    return TaskOut.model_validate(task)


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_task_access = can_manage_all_tasks(role, custom_permissions)
    own_task_access = can_manage_own_tasks(role, custom_permissions)
    if role == "observer" and not full_task_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot update tasks.")
    if role == "member" and not own_task_access and not full_task_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update tasks.")
    service = TaskService(db)
    task = await service.get_task(business_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    update_data = payload.model_dump(exclude_unset=True, mode="python")
    if role == "member" and not full_task_access:
        can_claim_unassigned_task = (
            task.assigned_to is None
            and update_data.keys() <= {"assigned_to"}
            and update_data.get("assigned_to") == current_user.id
        )
        if task.assigned_to != current_user.id and not can_claim_unassigned_task:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only update their own tasks.")
        if task.assigned_to == current_user.id and "assigned_to" in update_data and update_data["assigned_to"] not in {None, current_user.id}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members cannot reassign tasks to other teammates.")
    return TaskOut.model_validate(await service.update_task(task, payload, triggered_by_user_id=current_user.id))


@router.delete("/{task_id}", response_model=dict)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> dict:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    if not can_delete_tasks(role, custom_permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only manager and above can delete tasks.")
    service = TaskService(db)
    task = await service.get_task(business_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    await service.delete_task(task, triggered_by_user_id=current_user.id)
    return {"deleted": str(task_id)}


@router.post("/{task_id}/done", response_model=TaskOut)
async def mark_task_done(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    business_id: uuid.UUID = Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> TaskOut:
    member = await BusinessService(db).get_member(business_id, current_user.id)
    role = member.role if member else None
    custom_permissions = member.custom_permissions if member else []
    full_task_access = can_manage_all_tasks(role, custom_permissions)
    own_task_access = can_manage_own_tasks(role, custom_permissions)
    if role == "observer" and not full_task_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Observers cannot update tasks.")
    if role == "member" and not own_task_access and not full_task_access:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update tasks.")
    service = TaskService(db)
    task = await service.get_task(business_id, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if role == "member" and not full_task_access and task.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members can only update their own tasks.")
    return TaskOut.model_validate(await service.mark_done(task, triggered_by_user_id=current_user.id))
