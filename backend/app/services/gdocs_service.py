class GoogleDocsService:
    async def generate_contract_pdf(self, lead_uid: str) -> str:
        return f"contract-{lead_uid}.pdf"
