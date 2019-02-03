import JSZip from 'jszip';
import FileSaver from 'file-saver';

export function generateZip(embedName, files) {
  let zip = new JSZip();
  for (let file of files) {
    zip.file(file.getName(), file.getValue());
  }

  return zip;
}

export function saveZipAsFile(embedName, zip) {
  zip.generateAsync({ type: 'blob' }).then(content => {
    FileSaver.saveAs(content, `${embedName}.zip`);
  }).catch(err => {
    console.error('saveZipAsFile', err);
  });
}

export function saveTextAsFile(embedName, file) {
  if (!file) {
    console.warn('zipUtil.saveTextAsFile received invalid file', file);
    return;
  }

  const fileData = [];
  fileData.push(file.getValue());
  const fileObj = new Blob(fileData, {type: 'text/plain;charset=utf-8'});
  FileSaver.saveAs(fileObj, `${embedName}.${file.getName()}`);
}