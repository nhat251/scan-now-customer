import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import ts from "typescript";

const ROOT = path.resolve("src");
const SHADCN_ROOT = `${path.join(ROOT, "components", "ui")}${path.sep}`;

async function collectTsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectTsxFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".tsx") ? [entryPath] : [];
    })
  );

  return files.flat();
}

function hasJsx(node) {
  let found = false;

  function visit(child) {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
      found = true;
      return;
    }

    ts.forEachChild(child, visit);
  }

  visit(node);
  return found;
}

function isPascalCase(name) {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

function isReactWrapper(expression) {
  if (!ts.isCallExpression(expression)) {
    return false;
  }

  const callee = expression.expression.getText();
  return (
    callee === "memo" ||
    callee === "React.memo" ||
    callee === "forwardRef" ||
    callee === "React.forwardRef"
  );
}

function declarationLine(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

function findComponents(sourceFile) {
  const components = [];

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.body) {
      const name = statement.name?.text ?? "default";
      const isDefault = statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword
      );

      if ((isPascalCase(name) || isDefault) && hasJsx(statement.body)) {
        components.push({
          line: declarationLine(sourceFile, statement),
          name,
        });
      }
      continue;
    }

    if (ts.isClassDeclaration(statement) && statement.name) {
      const heritage = statement.heritageClauses
        ?.flatMap((clause) => clause.types)
        .map((type) => type.expression.getText());

      if (
        isPascalCase(statement.name.text) &&
        heritage?.some((name) =>
          ["Component", "PureComponent", "React.Component", "React.PureComponent"].includes(name)
        )
      ) {
        components.push({
          line: declarationLine(sourceFile, statement),
          name: statement.name.text,
        });
      }
      continue;
    }

    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }

      const name = declaration.name.text;
      const initializer = declaration.initializer;
      const isFunction = ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer);

      if (
        isPascalCase(name) &&
        ((isFunction && hasJsx(initializer)) || isReactWrapper(initializer))
      ) {
        components.push({
          line: declarationLine(sourceFile, declaration),
          name,
        });
      }
    }
  }

  return components;
}

const files = (await collectTsxFiles(ROOT)).filter((file) => !file.startsWith(SHADCN_ROOT)).sort();
const violations = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const components = findComponents(sourceFile);

  if (components.length > 1) {
    violations.push({ components, file: path.relative(process.cwd(), file) });
  }
}

if (violations.length === 0) {
  console.log(`Component audit passed (${files.length} TSX files checked).`);
  process.exit(0);
}

console.error(`Component audit failed: ${violations.length} files contain multiple components.`);

for (const violation of violations) {
  console.error(`\n${violation.file}`);
  for (const component of violation.components) {
    console.error(`  ${component.line}: ${component.name}`);
  }
}

process.exit(1);
