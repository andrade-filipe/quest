import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extensão QuestLang ativada.');
  // Cria uma coleção de diagnósticos para a QuestLang
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('questlang');
  
  // Atualiza os diagnósticos quando abrir um arquivo .quest ou quando ele for alterado
  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document, diagnosticCollection))
  );
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => updateDiagnostics(doc, diagnosticCollection))
  );
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
  console.log(`Atualizando diagnósticos para ${document.uri} com languageId ${document.languageId}`);
  
  if (document.languageId !== 'quest') {
    console.log('LanguageId incompatível, ignorando.');
    return;
  }


  const diagnostics: vscode.Diagnostic[] = [];
  const parser = new QuestLangParser(document.getText());
  const errors = parser.parse();

  errors.forEach(error => {
    const startPos = document.positionAt(error.position);
    const endPos = document.positionAt(error.position + error.length);
    const range = new vscode.Range(startPos, endPos);
    const diagnostic = new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
    diagnostics.push(diagnostic);
  });

  collection.set(document.uri, diagnostics);
}

interface ParseError {
  position: number;
  length: number;
  message: string;
}

class QuestLangParser {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  public parse(): ParseError[] {
    const errors: ParseError[] = [];
    const lines = this.text.split('\n');
    let position = 0;

    for (const line of lines) {
      // Exemplo simples: cada linha de comando deve terminar com ";"
      if (line.trim() && !line.trim().endsWith(';')) {
        errors.push({
          position: position,
          length: line.length,
          message: "Erro sintático: comando deve terminar com ';'"
        });
      }
      position += line.length + 1;
    }

    // Expanda aqui as regras para if, while, for, etc.
    return errors;
  }
}
