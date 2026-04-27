import js from '@eslint/js'
import cssModules from 'eslint-plugin-css-modules'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const componentNamePattern = /^[A-Z][A-Za-z0-9]*$/
const functionNodeTypes = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

const isComponentName = (value) => componentNamePattern.test(value)

const isFunctionNode = (node) =>
  Boolean(node && functionNodeTypes.has(node.type))

const getWrappedRenderFunction = (node) => {
  if (!node || node.type !== 'CallExpression') {
    return null
  }

  for (const argument of node.arguments) {
    if (isFunctionNode(argument)) {
      return argument
    }

    if (argument?.type === 'CallExpression') {
      const nestedFunction = getWrappedRenderFunction(argument)
      if (nestedFunction) {
        return nestedFunction
      }
    }
  }

  return null
}

const getComponentDescriptor = (node) => {
  if (
    node.type === 'FunctionDeclaration' &&
    node.id?.type === 'Identifier' &&
    isComponentName(node.id.name)
  ) {
    return {
      body: node.body,
      name: node.id.name,
    }
  }

  if (
    node.type === 'VariableDeclarator' &&
    node.id.type === 'Identifier' &&
    isComponentName(node.id.name)
  ) {
    if (isFunctionNode(node.init)) {
      return {
        body: node.init.body,
        name: node.id.name,
      }
    }

    const wrappedRenderFunction = getWrappedRenderFunction(node.init)
    if (wrappedRenderFunction) {
      return {
        body: wrappedRenderFunction.body,
        name: node.id.name,
      }
    }
  }

  return null
}

const isSameComponentReference = (node, componentName) => {
  if (!node) {
    return false
  }

  if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
    return node.name === componentName
  }

  return false
}

const isReactCreateElementCall = (node, componentName) => {
  if (node.type !== 'CallExpression') {
    return false
  }

  const isMemberCall =
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'React' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'createElement'

  const isDirectCall =
    node.callee.type === 'Identifier' && node.callee.name === 'createElement'

  if (!isMemberCall && !isDirectCall) {
    return false
  }

  return isSameComponentReference(node.arguments[0], componentName)
}

const findRecursiveRenderReference = (node, componentName, visitorKeys) => {
  let recursiveNode = null

  const visit = (currentNode) => {
    if (!currentNode || recursiveNode) {
      return
    }

    if (
      currentNode.type === 'JSXElement' &&
      isSameComponentReference(currentNode.openingElement.name, componentName)
    ) {
      recursiveNode = currentNode.openingElement.name
      return
    }

    if (
      currentNode.type === 'JSXSelfClosingElement' &&
      isSameComponentReference(currentNode.name, componentName)
    ) {
      recursiveNode = currentNode.name
      return
    }

    if (
      currentNode.type === 'CallExpression' &&
      (isSameComponentReference(currentNode.callee, componentName) ||
        isReactCreateElementCall(currentNode, componentName))
    ) {
      recursiveNode = isSameComponentReference(currentNode.callee, componentName)
        ? currentNode.callee
        : currentNode.arguments[0]
      return
    }

    const keys = visitorKeys[currentNode.type] ?? []
    for (const key of keys) {
      const value = currentNode[key]

      if (Array.isArray(value)) {
        for (const childNode of value) {
          visit(childNode)
        }
        continue
      }

      visit(value)
    }
  }

  visit(node)
  return recursiveNode
}

const noRecursiveComponentRender = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Запрещает рекурсивный рендер компонента через JSX или прямой вызов',
    },
    messages: {
      recursiveRender:
        'Компонент "{{name}}" рекурсивно рендерит сам себя.',
    },
    schema: [],
  },
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys

    const checkNode = (node) => {
      const component = getComponentDescriptor(node)
      if (!component) {
        return
      }

      const recursiveReference = findRecursiveRenderReference(
        component.body,
        component.name,
        visitorKeys,
      )

      if (!recursiveReference) {
        return
      }

      context.report({
        node: recursiveReference,
        messageId: 'recursiveRender',
        data: {
          name: component.name,
        },
      })
    }

    return {
      FunctionDeclaration: checkNode,
      VariableDeclarator: checkNode,
    }
  },
}

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', '.vite']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'css-modules': cssModules,
      local: {
        rules: {
          'no-recursive-component-render': noRecursiveComponentRender,
        },
      },
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'unused-imports/no-unused-imports': 'warn',
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'local/no-recursive-component-render': 'error',
      'no-unused-private-class-members': 'warn',
      'css-modules/no-unused-class': 'warn',
      'css-modules/no-undef-class': 'warn',
    },
  },
])
