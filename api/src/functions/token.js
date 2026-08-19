const { app } = require('@azure/functions');
const { StorageSharedKeyCredential, generateBlobSASQueryParameters, ContainerSASPermissions } = require('@azure/storage-blob');

const WAZNOSC_MIN = 15;

app.http('token', {
  methods: ['GET'],
  authLevel: 'anonymous', // brama dostepu jest w staticwebapp.config.json (allowedRoles: authenticated)
  route: 'token',
  handler: async (request, context) => {
    const principalHeader = request.headers.get('x-ms-client-principal');
    if (!principalHeader) {
      return { status: 401, jsonBody: { blad: 'Brak zalogowanego uzytkownika' } };
    }

    let uzytkownik = 'nieznany';
    try {
      const principal = JSON.parse(Buffer.from(principalHeader, 'base64').toString('utf-8'));
      uzytkownik = principal.userDetails ?? uzytkownik;
    } catch {
      // nie krytyczne - tylko do logu
    }

    const accountName = process.env.STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.STORAGE_ACCOUNT_KEY;
    const containerName = process.env.STORAGE_CONTAINER_NAME ?? 'agroas-cashflow-data';

    if (!accountName || !accountKey) {
      context.error('Brak STORAGE_ACCOUNT_NAME/STORAGE_ACCOUNT_KEY w ustawieniach aplikacji');
      return { status: 500, jsonBody: { blad: 'Konfiguracja serwera niekompletna' } };
    }

    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const wygasa = new Date(Date.now() + WAZNOSC_MIN * 60 * 1000);

    const sas = generateBlobSASQueryParameters(
      {
        containerName,
        permissions: ContainerSASPermissions.parse('rl'),
        protocol: 'https',
        expiresOn: wygasa,
      },
      credential,
    ).toString();

    context.log(`CashFlow token wydany dla ${uzytkownik}, wazny do ${wygasa.toISOString()}`);

    return {
      status: 200,
      jsonBody: {
        baseUrl: `https://${accountName}.blob.core.windows.net/${containerName}`,
        sas,
        wygasa: wygasa.toISOString(),
      },
    };
  },
});
