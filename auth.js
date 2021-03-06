// Following code was originally found at 
// https://gist.github.com/bcnzer/e6a7265fd368fa22ef960b17b9a76488
// before being adapted to be middleware.

/**
 * Middleware to handle authentication from the request
 * @param {Request} request
 */
export default async function auth(request) {
  let isValid = await isValidJwt(request)
  if (!isValid) {
    // It is immediately failing here, which is great. The worker doesn't bother hitting your API
    console.log('JWT is NOT valid')
    return new Response('Invalid JWT', { status: 403 })
  } else {
    console.log('JWT is valid')
  }
}

/**
 * Parse the JWT and validate it.
 *
 * We are just checking that the signature is valid, but you can do more that. 
 * For example, check that the payload has the expected entries or if the signature is expired..
 */ 
async function isValidJwt(request) {
  const encodedToken = getJwt(request);
  if (encodedToken === null) {
    return false
  }
  const token = decodeJwt(encodedToken)

  console.debug("Token payload", token.payload)

  // Is the token expired?
  let expiryDate = new Date(token.payload.exp * 1000)
  let currentDate = new Date(Date.now())
  if (expiryDate <= currentDate) {
    console.log('expired token')
    return false
  }

  return isValidJwtSignature(token)
}

/**
 * For this example, the JWT is passed in as part of the Authorization header,
 * after the Bearer scheme.
 * Parse the JWT out of the header and return it.
 */
function getJwt(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader.substring(0, 6) !== 'Bearer') {
    return null
  }
  return authHeader.substring(6).trim()
}

/**
 * Parse and decode a JWT.
 * A JWT is three, base64 encoded, strings concatenated with ‘.’:
 *   a header, a payload, and the signature.
 * The signature is “URL safe”, in that ‘/+’ characters have been replaced by ‘_-’
 * 
 * Steps:
 * 1. Split the token at the ‘.’ character
 * 2. Base64 decode the individual parts
 * 3. Retain the raw Bas64 encoded strings to verify the signature
 */
function decodeJwt(token) {
  const parts = token.split('.');
  const header = JSON.parse(atob(parts[0]));
  const payload = JSON.parse(atob(parts[1]));
  const signature = atob(parts[2].replace(/_/g, '/').replace(/-/g, '+'));
  console.log(header)
  return {
    header: header,
    payload: payload,
    signature: signature,
    raw: { header: parts[0], payload: parts[1], signature: parts[2] }
  }
}

/**
 * Validate the JWT.
 *
 * Steps:
 * Reconstruct the signed message from the Base64 encoded strings.
 * Load the RSA public key into the crypto library.
 * Verify the signature with the message and the key.
 */
async function isValidJwtSignature(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode([token.raw.header, token.raw.payload].join('.'));
  const signature = new Uint8Array(Array.from(token.signature).map(c => c.charCodeAt(0)));
  /*
    const jwk = {
      alg: 'RS256',
      e: 'AQAB',
      ext: true,
      key_ops: ['verify'],
      kty: 'RSA',
      n: RSA_PUBLIC_KEY
    };
  */
  // You need to JWK data with whatever is your public RSA key. If you're using Auth0 you
  // can download it from https://[your_domain].auth0.com/.well-known/jwks.json
  const jwk = {
    alg: "RS256",
    kty: "RSA",
    key_ops: ['verify'],
    use: "sig",
    x5c: [JWT_X5C], // JWT_X5C needs to be set as a Worker Secret
    n: JWT_N,       // JWT_N needs to be set as a Worker Secret
    e: "AQAB",
    kid: JWT_KID,   // JWT_KID needs to be set as a Worker Secret
    x5t: JWT_X5T    // JWT_X5T needs to be set as a Worker Secret
  }
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
}