import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import ts from "typescript";

const ROOT = path.resolve("src");
const UI_ATTRIBUTE_NAMES = new Set([
  "alt",
  "aria-label",
  "caption",
  "detail",
  "description",
  "heading",
  "helper",
  "itemLabel",
  "label",
  "message",
  "mobileLabel",
  "placeholder",
  "portalLabel",
  "portalName",
  "submitLabel",
  "tagString",
  "title",
  "topbarTitle",
]);
const UI_CALL_NAMES = new Set(["alert", "confirm", "notify", "showNotify", "setError", "toast"]);
const ERROR_MAPPER_CALL_NAMES = new Set([
  "getApiErrorMessage",
  "getManageApiErrorMessage",
  "getOwnerTableErrorMessage",
  "getVietnameseApiErrorMessage",
]);
const VALIDATION_CALL_NAMES = new Set(["email", "max", "min", "regex", "url"]);
const ALLOWED_EXACT_TEXT = new Set([
  "/ trang",
  "API",
  "Email",
  "PayOS",
  "QR",
  "ScanNow",
  "Trang",
  "URL",
  "VAT",
]);
const ALLOWED_TOKEN_PATTERN = /\b(?:API|Email|PayOS|QR|ScanNow|URL|VAT|HTTP|HTTPS|ID|CSV|Excel)\b/g;
const VIETNAMESE_CHARACTER_PATTERN =
  /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/iu;
const ENGLISH_WORD_PATTERN = /\b[A-Za-z]{2,}\b/;
const RAW_PRESENTATION_FIELDS = new Set([
  "discountType",
  "paymentMethod",
  "paymentStatus",
  "role",
  "source",
  "status",
]);
const UI_IDENTIFIER_PATTERN =
  /(?:caption|copy|description|detail|heading|helper|label|message|summary|text|title)$/i;

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectSourceFiles(entryPath);
      }

      return entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
    })
  );

  return files.flat();
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function looksEnglish(value) {
  const text = normalizeText(value);

  if (
    !text ||
    ALLOWED_EXACT_TEXT.has(text) ||
    VIETNAMESE_CHARACTER_PATTERN.test(text) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ||
    (/^[\w:[\]./-]+$/.test(text) && /[:[\]/-]/.test(text))
  ) {
    return false;
  }

  const withoutAllowedTokens = text.replace(ALLOWED_TOKEN_PATTERN, "");
  return ENGLISH_WORD_PATTERN.test(withoutAllowedTokens);
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

function addIssue(issues, sourceFile, node, type, detail) {
  issues.push({
    detail: normalizeText(detail),
    line: lineOf(sourceFile, node),
    type,
  });
}

function propertyNameText(name) {
  if (!name) {
    return "";
  }
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }
  return name.getText();
}

function literalText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
}

function functionLikeName(node) {
  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)) &&
    node.name
  ) {
    return node.name.getText();
  }

  if (
    (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
    ts.isVariableDeclaration(node.parent)
  ) {
    return propertyNameText(node.parent.name);
  }

  return "";
}

function enclosingUiFunctionName(node) {
  let current = node.parent;

  while (current) {
    if (
      ts.isFunctionDeclaration(current) ||
      ts.isFunctionExpression(current) ||
      ts.isArrowFunction(current)
    ) {
      const name = functionLikeName(current);
      return UI_IDENTIFIER_PATTERN.test(name) ? name : "";
    }
    current = current.parent;
  }

  return "";
}

function renderedLiteralTexts(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return [node.text];
  }

  if (ts.isTemplateExpression(node)) {
    return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
  }

  if (ts.isParenthesizedExpression(node)) {
    return renderedLiteralTexts(node.expression);
  }

  if (ts.isConditionalExpression(node)) {
    return [...renderedLiteralTexts(node.whenTrue), ...renderedLiteralTexts(node.whenFalse)];
  }

  if (ts.isBinaryExpression(node)) {
    if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      return renderedLiteralTexts(node.right);
    }
    if (
      node.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
      node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    ) {
      return [...renderedLiteralTexts(node.left), ...renderedLiteralTexts(node.right)];
    }
  }

  return [];
}

function jsxTagName(attribute) {
  const attributes = attribute.parent;
  const element = attributes?.parent;

  if (element && (ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element))) {
    return element.tagName.getText();
  }

  return "";
}

function isUiJsxAttribute(attribute) {
  const name = attribute.name.getText();
  if (UI_ATTRIBUTE_NAMES.has(name)) {
    return true;
  }

  if (name !== "value") {
    return false;
  }

  return [
    "MeInfoRow",
    "OwnerTableInfoRow",
    "PortalStatCard",
    "VoucherMetric",
    "WaiterInfoRow",
  ].includes(jsxTagName(attribute));
}

function isRawPresentationExpression(node) {
  if (ts.isPropertyAccessExpression(node)) {
    return RAW_PRESENTATION_FIELDS.has(node.name.text);
  }
  if (
    ts.isElementAccessExpression(node) &&
    node.argumentExpression &&
    ts.isStringLiteral(node.argumentExpression)
  ) {
    return RAW_PRESENTATION_FIELDS.has(node.argumentExpression.text);
  }
  return false;
}

function isDirectBackendMessage(node) {
  if (ts.isPropertyAccessExpression(node)) {
    return ["detail", "message", "title"].includes(node.name.text);
  }
  if (ts.isBinaryExpression(node)) {
    return isDirectBackendMessage(node.left) || isDirectBackendMessage(node.right);
  }
  if (ts.isConditionalExpression(node)) {
    return isDirectBackendMessage(node.whenTrue) || isDirectBackendMessage(node.whenFalse);
  }
  return false;
}

function auditSource(sourceFile) {
  const issues = [];

  function visit(node) {
    if (ts.isJsxText(node)) {
      const text = normalizeText(node.text);
      if (looksEnglish(text)) {
        addIssue(issues, sourceFile, node, "english-jsx", text);
      }
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText();
      if (isUiJsxAttribute(node) && node.initializer) {
        if (ts.isStringLiteral(node.initializer) && looksEnglish(node.initializer.text)) {
          addIssue(
            issues,
            sourceFile,
            node,
            "english-attribute",
            `${name}="${node.initializer.text}"`
          );
        }
        if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          for (const text of renderedLiteralTexts(node.initializer.expression)) {
            if (looksEnglish(text)) {
              addIssue(issues, sourceFile, node, "english-attribute", `${name}="${text}"`);
            }
          }
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const name = propertyNameText(node.name);
      if (UI_ATTRIBUTE_NAMES.has(name)) {
        for (const text of renderedLiteralTexts(node.initializer)) {
          if (looksEnglish(text)) {
            addIssue(issues, sourceFile, node, "english-object-copy", `${name}: "${text}"`);
          }
        }
      }
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (UI_IDENTIFIER_PATTERN.test(node.name.text)) {
        for (const text of renderedLiteralTexts(node.initializer)) {
          if (looksEnglish(text)) {
            addIssue(
              issues,
              sourceFile,
              node,
              "english-ui-variable",
              `${node.name.text}: "${text}"`
            );
          }
        }
      }
    }

    if (ts.isReturnStatement(node) && node.expression) {
      const functionName = enclosingUiFunctionName(node);
      if (functionName) {
        for (const text of renderedLiteralTexts(node.expression)) {
          if (looksEnglish(text)) {
            addIssue(
              issues,
              sourceFile,
              node,
              "english-ui-return",
              `${functionName}: "${text}"`
            );
          }
        }
      }
    }

    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText();
      const calleeName = ts.isPropertyAccessExpression(node.expression)
        ? node.expression.name.text
        : callee;
      if (UI_CALL_NAMES.has(calleeName)) {
        for (const argument of node.arguments) {
          const text = literalText(argument);
          if (text && looksEnglish(text)) {
            addIssue(issues, sourceFile, argument, "english-notification", text);
          }
          if (isDirectBackendMessage(argument)) {
            addIssue(issues, sourceFile, argument, "raw-backend-error", argument.getText());
          }
        }
      }

      if (
        ERROR_MAPPER_CALL_NAMES.has(calleeName) ||
        VALIDATION_CALL_NAMES.has(calleeName)
      ) {
        for (const argument of node.arguments) {
          for (const text of renderedLiteralTexts(argument)) {
            if (looksEnglish(text)) {
              addIssue(
                issues,
                sourceFile,
                argument,
                ERROR_MAPPER_CALL_NAMES.has(calleeName)
                  ? "english-error-fallback"
                  : "english-validation",
                text
              );
            }
          }
        }
      }

      if (
        (callee === "Intl.DateTimeFormat" ||
          callee.endsWith(".toLocaleDateString") ||
          callee.endsWith(".toLocaleString")) &&
        node.arguments.some((argument) => literalText(argument) === "en-US")
      ) {
        addIssue(issues, sourceFile, node, "english-locale", node.getText());
      }
    }

    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
    ) {
      for (const text of renderedLiteralTexts(node.expression)) {
        if (looksEnglish(text)) {
          addIssue(issues, sourceFile, node, "english-jsx-expression", text);
        }
      }
    }

    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      isRawPresentationExpression(node.expression)
    ) {
      addIssue(issues, sourceFile, node, "raw-backend-value", node.expression.getText());
    }

    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken &&
      ts.isElementAccessExpression(node.left) &&
      !ts.isCallExpression(node.left.expression) &&
      (ts.isIdentifier(node.right) || ts.isPropertyAccessExpression(node.right))
    ) {
      const right = node.right.getText();
      const left = node.left.getText();
      if (left.includes(right)) {
        addIssue(issues, sourceFile, node, "raw-mapper-fallback", node.getText());
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}

const files = (await collectSourceFiles(ROOT))
  .filter((file) => !/\.(?:test|spec)\.(?:ts|tsx)$/.test(file))
  .filter((file) => !file.includes(`${path.sep}test${path.sep}`))
  .sort();
const violations = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const issues = auditSource(sourceFile);

  if (issues.length > 0) {
    violations.push({
      file: path.relative(process.cwd(), file),
      issues,
    });
  }
}

if (violations.length === 0) {
  console.log(`Vietnamese UI audit passed (${files.length} source files checked).`);
  process.exit(0);
}

const issueCount = violations.reduce((total, violation) => total + violation.issues.length, 0);
console.error(`Vietnamese UI audit failed: ${issueCount} issues in ${violations.length} files.`);

for (const violation of violations) {
  console.error(`\n${violation.file}`);
  for (const issue of violation.issues) {
    console.error(`  ${issue.line} [${issue.type}] ${issue.detail}`);
  }
}

process.exit(1);
