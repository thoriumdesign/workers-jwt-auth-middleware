## Cloudflare Workers JWT Authentication Middleware

This example uses the [`itty-router`](https://github.com/kwhitley/itty-router) package to add routing to the Cloudflare Worker.

`auth.js` is the file with the JWT validation code.

### Using this code

You can use [wrangler](https://github.com/cloudflare/wrangler) to generate a new Cloudflare Workers project based on the itty-router template by running the following command from your terminal:

```
wrangler generate myapp https://github.com/cloudflare/worker-template-router
```

Before publishing your code you need to edit `wrangler.toml` file and add your Cloudflare `account_id` - more information about configuring and publishing your code can be found [in the documentation](https://developers.cloudflare.com/workers/learning/getting-started#7-configure-your-project-for-deployment).

To add JWT authentication, add `auth.js` to your worker. Consider adding a `./src` folder to your project, putting `auth.js` in that folder, and updating your import script in `index.js` to `import auth from './src/auth.js'`,

When `auth.js` is added and imported, use it as middleware in private router calls by calling the function `auth` like so:

```
router.get("/private-route", auth, fooBar)
```

In the above example, `.get` can be replaced with any method like `.post` or even a catch-all method like `.all`. Also, `fooBar` is a placeholder function for your preferred function to handle the authenticated request.

Once you are ready, you can publish your code by running the following command:

```
wrangler publish
```

### Worker Secrets Environment Variables

After publishing your Worker, for the middleware to work, you need to add the Wrangler Secrets to the Worker.

You need your JWT public RSA key. If you're using Auth0 you can download it from `https://[your_domain].auth0.com/.well-known/jwks.json`

You may have trouble adding large strings through console, and can add them in the Cloudflare Workers dashboard once your Worker is published.

You need the add the following four values: `JWT_X5C, JWT_N, JWT_KID, JWT_X5T`

Add them from the terminal like so:

```
wrangler secret put JWT_X5C
```

Then, at the prompt, paste the value and press enter.