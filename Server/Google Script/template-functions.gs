/**
 * Simple include()
 *
 * @return {string} The HTML output.
 * Used in Index.html to include other html files
 */
function include (filename, vars) {
  var t = HtmlService.createTemplateFromFile(filename);
  t.vars = vars;
  return t.evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .getContent();
}