class ExportService:
    async def generate_csv(self, business_id: str) -> bytes:
        return b"uid,name\n"
