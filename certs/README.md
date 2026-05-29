# Aiven CA certificate

This folder must contain `aiven-ca.pem` when `DB_SSL_CA=certs/aiven-ca.pem` is set in `.env`.

## Download from Aiven

1. Open [Aiven Console](https://console.aiven.io/) and select your **MySQL** service.
2. Go to the **Overview** tab.
3. In **Connection information**, find **CA certificate** (or **Download CA certificate**).
4. Download the `.pem` file.
5. Save it in this folder as:

   `F:\TARZAN\workspace\Demo Credit\DemoCreditTest\certs\aiven-ca.pem`

The file name must match exactly: `aiven-ca.pem`.

## Verify

From the project root:

```powershell
npm run db:check
```

Then run migrations:

```powershell
npm run migrate
```
