function cleanResumeText(text) {
  return text
    .replace(/\r\n/g, "\n")       
    .replace(/\n{2,}/g, "\n")     
    .replace(/[ \t]+/g, " ")      
    .trim();                     
}

module.exports = cleanResumeText;
