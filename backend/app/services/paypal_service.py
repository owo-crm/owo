class PayPalService:
    async def create_subscription_link(self, business_id: str) -> str:
        return f"/paypal/subscribe/{business_id}"
