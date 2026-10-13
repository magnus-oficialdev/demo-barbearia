# Bibliotecas de terceiros (cópia local, versões fixas)

O site não tem etapa de build. Estas cópias ficam no repositório para o importmap
apontar para arquivos locais e conhecidos.

| Pasta | Origem (npm) | Licença |
|---|---|---|
| `three@0.186.1/` | `three@0.186.1` → `build/three.core.js` e `build/three.module.js` | MIT (`LICENSE`) |
| `gsap@3.15.0/` | `gsap@3.15.0` → `dist/gsap.min.js` (cópia sem alteração) | Standard "no charge" — https://gsap.com/standard-license |

## Como os arquivos do three foram gerados

O pacote `three@0.186.1` não traz versões `.min.js`. Os dois arquivos foram
minificados uma única vez, sem empacotar nem alterar o código:

```sh
npm pack three@0.186.1 && tar xzf three-0.186.1.tgz
cd package/build
npx esbuild@0.25.10 three.core.js   --minify --format=esm --outfile=three.core.min.js
npx esbuild@0.25.10 three.module.js --minify --format=esm --outfile=three.module.min.js
sed -i 's#\./three\.core\.js#./three.core.min.js#g' three.module.min.js
```

Para trocar por CDN, aponte o importmap para
`https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js`
(arquivo existe no pacote; o acesso ao jsDelivr não foi testado neste ambiente).
