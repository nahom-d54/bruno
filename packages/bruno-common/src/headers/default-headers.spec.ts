import {
  applyOmitHeaders,
  shouldOmitConnection,
  getBrunoDefaultHeaderNames,
  getDefaultUserAgent,
  DEFAULT_USER_AGENT,
  BRUNO_DEFAULT_HEADERS
} from './default-headers';

const createHeaders = () => {
  const values = new Map<string, unknown>();
  return {
    values,
    set: (name: string, value: unknown) => {
      values.set(name.toLowerCase(), value);
    }
  };
};

describe('bruno default headers catalog', () => {
  it('includes the expected default header names', () => {
    expect(getBrunoDefaultHeaderNames()).toEqual([
      'User-Agent',
      'Accept',
      'Accept-Encoding',
      'Connection',
      'Host'
    ]);
  });

  it('provides the default User-Agent string', () => {
    expect(getDefaultUserAgent()).toBe(DEFAULT_USER_AGENT);
    expect(getDefaultUserAgent()).toContain('Chrome/151.0.0.0');
  });

  it('marks Host as not omittable', () => {
    const host = BRUNO_DEFAULT_HEADERS.find((header) => header.name === 'Host');
    expect(host?.omittable).toBe(false);
  });

  it('uses an angle-bracket Host placeholder before the host is known', () => {
    const host = BRUNO_DEFAULT_HEADERS.find((header) => header.name === 'Host');
    expect(host?.previewValue).toBe('<derived from request URL>');
  });
});

describe('applyOmitHeaders', () => {
  it('sets omitted defaults to null', () => {
    const headers = createHeaders();
    applyOmitHeaders(headers, {
      omitHeaders: ['Accept', 'Accept-Encoding']
    });

    expect(headers.values.get('accept')).toBeNull();
    expect(headers.values.get('accept-encoding')).toBeNull();
  });

  it('does not omit Host', () => {
    const headers = createHeaders();
    applyOmitHeaders(headers, {
      omitHeaders: ['Host', 'Accept']
    });

    expect(headers.values.has('host')).toBe(false);
    expect(headers.values.get('accept')).toBeNull();
  });

  it('does not omit an explicit user header via omitHeaders alone', () => {
    const headers = createHeaders();
    applyOmitHeaders(headers, {
      omitHeaders: ['Accept'],
      explicitHeaderNames: ['Accept']
    });

    expect(headers.values.has('accept')).toBe(false);
  });

  it('clears an explicit header when listed in headersToDelete', () => {
    const headers = createHeaders();
    applyOmitHeaders(headers, {
      omitHeaders: ['Accept'],
      headersToDelete: ['Accept'],
      explicitHeaderNames: ['Accept']
    });

    expect(headers.values.get('accept')).toBeNull();
  });

  it('defers Connection clearing to the caller', () => {
    const headers = createHeaders();
    const result = applyOmitHeaders(headers, {
      omitHeaders: ['Connection']
    });

    expect(result.omitConnection).toBe(true);
    expect(headers.values.has('connection')).toBe(false);
  });
});

describe('shouldOmitConnection', () => {
  it('is true when Connection is omitted', () => {
    expect(shouldOmitConnection({ omitHeaders: ['Connection'] })).toBe(true);
  });

  it('is false when Connection is not listed', () => {
    expect(shouldOmitConnection({ omitHeaders: ['Accept'] })).toBe(false);
    expect(shouldOmitConnection()).toBe(false);
  });

  it('is false when the user set Connection explicitly', () => {
    expect(shouldOmitConnection({
      omitHeaders: ['Connection'],
      explicitHeaderNames: ['Connection']
    })).toBe(false);
  });

  it('is true when a script deletes an explicitly set Connection', () => {
    expect(shouldOmitConnection({
      omitHeaders: ['Connection'],
      headersToDelete: ['Connection'],
      explicitHeaderNames: ['Connection']
    })).toBe(true);
  });

  it('agrees with applyOmitHeaders on the same input', () => {
    const options = { omitHeaders: ['connection', 'Accept-Encoding'], explicitHeaderNames: ['Accept'] };
    const headers = createHeaders();

    expect(shouldOmitConnection(options)).toBe(applyOmitHeaders(headers, options).omitConnection);
  });
});
