/* global inject, expect */
/* eslint no-unused-expressions:off */
describe('test/client-unit/services/BaseReportService', () => {
  // shared services
  let SavedReports;

  // load bhima.services
  beforeEach(module(
    'pascalprecht.translate',
    'tmh.dynamicLocale',
    'ngStorage',
    'angularMoment',
    'ui.bootstrap',
    'bhima.services',
  ));

  let parseExtension;
  let parseIcon;
  beforeEach(inject((_BaseReportService_) => {
    SavedReports = _BaseReportService_;
    parseExtension = SavedReports.parseFileUrlToExtension;
    parseIcon = SavedReports.parseFileUrlToIcon;
  }));

  context('#parseUrlToExtension()', () => {
    it('#parseUrlToExtension() correctly parses simple paths', () => {
      expect(parseExtension('image.jpg')).to.equal('jpg');
      expect(parseExtension('image.svg')).to.equal('svg');
      expect(parseExtension('doc.docx')).to.equal('docx');

      expect(parseExtension('/this/is/some/path.pdf')).to.equal('pdf');
      expect(parseExtension('https://github.com/cool.gif')).to.equal('gif');

    });

    it('#parseUrlToExtension() handles error cases', () => {
      expect(parseExtension('')).to.equal('');
      expect(parseExtension()).to.equal('');
    });

    it('#parseUrlToExtension() correctly parses complex paths', () => {
      expect(parseExtension('a.file.with.decimals.pdf')).to.equal('pdf');
      expect(parseExtension('/more/complex/file.with/decimals.gz')).to.equal('gz');
    });
  });

  context('#parseUrlToIcon()', () => {
    it('#parseUrlToIcon() correctly parses paths to guess their icons', () => {
      expect(parseIcon('icon.png')).to.equal('fa-file-image-o');
      expect(parseIcon('icon.svg')).to.equal('fa-file-image-o');

      expect(parseIcon('document.doc')).to.equal('fa-file-word-o');
      expect(parseIcon('document.docx')).to.equal('fa-file-word-o');

      expect(parseIcon('msexcel.xls')).to.equal('fa-file-excel-o');
      expect(parseIcon('msexcel.xlsx')).to.equal('fa-file-excel-o');

      expect(parseIcon('unknown.what')).to.equal('fa-file-o');

      expect(parseIcon('report.pdf')).to.equal('fa-file-pdf-o');
    });
  });

});
