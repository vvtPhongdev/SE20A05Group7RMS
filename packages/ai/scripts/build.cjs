const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const configPath = path.resolve(__dirname, '..', 'tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);

if (config.error) {
  console.error(ts.formatDiagnostic(config.error, ts.createCompilerHost({})));
  process.exitCode = 1;
} else {
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
  const host = ts.createCompilerHost(parsed.options);

  host.writeFile = (fileName, content, writeByteOrderMark) => {
    fs.mkdirSync(path.dirname(fileName), { recursive: true });
    fs.writeFileSync(fileName, `${writeByteOrderMark ? '\ufeff' : ''}${content}`);
  };

  const program = ts.createProgram(parsed.fileNames, parsed.options, host);
  const emitResult = program.emit();
  const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
  }

  if (diagnostics.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) {
    process.exitCode = 1;
  }
}
