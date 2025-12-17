
Key Descision:
- Always read from local
  - WS will send synced results on connect
  - All mutations from other clients will be applied 
- Mutations depend on connection status
  - If wifi connected -> broadcast via ws and mutate locally
  - If not connected -> mutate locally
