### The recommended base for a TSConfig.

Add the package to your `"devDependencies"`:

```sh
npm install --save-dev @tsconfig/recommended
yarn add --dev @tsconfig/recommended
```

Add to your `tsconfig.json`:

```json
"extends": "@tsconfig/recommended/tsconfig.json"
```

---

The `tsconfig.json`: 

```jsonc
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Recommended"
}
```
