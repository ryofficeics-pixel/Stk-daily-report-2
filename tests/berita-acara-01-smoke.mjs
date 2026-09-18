import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
new Function(script);

const sourceOf = name => {
  const line = script.split("\n").find(value => value.startsWith(`function ${name}(`));
  assert.ok(line, `${name} must exist`);
  return line;
};

const factory = new Function(`
  const DEFAULT_LOGO_URL="brand-logo";
  const esc=value=>String(value??"");
  const fmtDate=value=>String(value??"");
  const fmtDateTime=value=>String(value??"");
  const photosOf=()=>[];
  const groupPhotosForPdf=()=>[];
  const baCompactRef=()=>"<div>ref</div>";
  const baCompactInfo=()=>"<div>info</div>";
  const baCompactSection=()=>"<div>section</div>";
  const baCompactChecklist=()=>"<table></table>";
  const baCompactTtd=()=>"<div>ttd</div>";
  const dailyPhotoCard=()=>"<div>photo</div>";
  ${sourceOf("footerHtml")}
  ${sourceOf("photoReportHeader")}
  ${sourceOf("photoReportFooter")}
  ${sourceOf("photoReportPage")}
  ${sourceOf("reportCoverPage")}
  ${sourceOf("beritaAcaraPdfPages")}
  return {beritaAcaraPdfPages,photoReportPage,reportCoverPage};
`);

const { beritaAcaraPdfPages, photoReportPage, reportCoverPage } = factory();
const record = { tanggal: "2026-09-18", statusPekerjaan: "Disetujui" };
const project = { name: "Proyek Uji" };

const blank = beritaAcaraPdfPages(record, project, true);
assert.doesNotMatch(blank, /brand-logo|PT\. Solusi Teknologi Konstruksi/);
assert.match(blank, /aria-hidden="true"/);

const branded = beritaAcaraPdfPages(record, project, false);
assert.match(branded, /brand-logo/);
assert.match(branded, /PT\. Solusi Teknologi Konstruksi/);

const blankPhoto = photoReportPage("Lampiran", "Proyek Uji", "18 Sep 2026", [null], null, 1, 1, "portrait", true);
assert.doesNotMatch(blankPhoto, /brand-logo|PT\. Solusi Teknologi Konstruksi/);

const blankCover = reportCoverPage("Berita Acara", "Berita Acara Pekerjaan", project, [], record.tanggal, undefined, true);
assert.doesNotMatch(blankCover, /brand-logo|PT\. Solusi Teknologi Konstruksi/);

console.log("Berita Acara 0.1 smoke test: PASS");
