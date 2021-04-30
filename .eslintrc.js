module.exports = {
  env: {
    commonjs: true,
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "airbnb",
    "prettier",
    "plugin:shopify/react",
    "plugin:shopify/polaris",
    "plugin:shopify/jest",
    "plugin:shopify/webpack",
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["prettier"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "import/no-unresolved": "off",
    "no-underscore-dangle": ["error", { allow: ["__APOLLO_CLIENT__"] }],
    "no-debugger": ["off"],
    "no-console": ["off"],
    "import/extensions": 0,
    "prettier/prettier": ["error"],
    "react/jsx-wrap-multilines": [
      "error",
      { declaration: false, assignment: false },
    ],
    "react/jsx-curly-newline": "off",
  },
  overrides: [
    {
      files: ["*.test.*"],
      rules: {
        "shopify/jsx-no-hardcoded-content": "off",
      },
    },
  ],
};
