/**
 * Generates docs/Library_Management_System_Interview_Guide.pdf from the Markdown guide.
 * Run from repo root: node backend/scripts/generateInterviewGuidePdf.js
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const repoRoot = path.join(__dirname, '..', '..');
const mdPath = path.join(repoRoot, 'docs', 'Library_Management_System_Interview_Guide.md');
const outPath = path.join(repoRoot, 'docs', 'Library_Management_System_Interview_Guide.pdf');

function stripInlineMd(s) {
    return s
        .replace(/👉/g, '>>')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, "'$1'");
}

function main() {
    if (!fs.existsSync(mdPath)) {
        console.error('Missing:', mdPath);
        process.exit(1);
    }

    const raw = fs.readFileSync(mdPath, 'utf8');
    const lines = raw.split(/\r?\n/);

    const doc = new PDFDocument({
        margin: 48,
        size: 'A4',
        bufferPages: true,
        info: {
            Title: 'Library Management System — Interview Guide',
            Author: 'MiniProject',
        },
    });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const textWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let inCode = false;

    const writeBody = (line) => {
        const t = stripInlineMd(line);
        if (!t.trim()) {
            doc.moveDown(0.35);
            return;
        }
        doc.font('Helvetica').fontSize(10).text(t, { width: textWidth, align: 'left' });
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith('```')) {
            inCode = !inCode;
            doc.moveDown(inCode ? 0.4 : 0.2);
            continue;
        }

        if (inCode) {
            doc
                .font('Courier')
                .fontSize(8.5)
                .text(stripInlineMd(line) || ' ', { width: textWidth, align: 'left' });
            continue;
        }

        if (line.trim() === '---') {
            doc.moveDown(0.4);
            doc.font('Helvetica').fontSize(9).text('— — — — — — — — — —', { width: textWidth });
            doc.moveDown(0.4);
            continue;
        }

        if (line.startsWith('# ')) {
            doc.moveDown(0.6);
            doc.font('Helvetica-Bold')
                .fontSize(16)
                .text(stripInlineMd(line.slice(2)), { width: textWidth });
            doc.moveDown(0.45);
            continue;
        }
        if (line.startsWith('## ')) {
            doc.moveDown(0.45);
            doc.font('Helvetica-Bold')
                .fontSize(12.5)
                .text(stripInlineMd(line.slice(3)), { width: textWidth });
            doc.moveDown(0.35);
            continue;
        }
        if (line.startsWith('### ')) {
            doc.moveDown(0.25);
            doc.font('Helvetica-Bold')
                .fontSize(11)
                .text(stripInlineMd(line.slice(4)), { width: textWidth });
            doc.moveDown(0.25);
            continue;
        }

        if (/^\|.+\|\s*$/.test(line) && line.includes('|')) {
            const isSeparator = /^\|\s*[-:]/.test(line);
            if (isSeparator) continue;
            doc.font('Courier').fontSize(7.8).text(stripInlineMd(line), { width: textWidth });
            continue;
        }

        if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
            const bullet = stripInlineMd(line.trimStart().replace(/^[-*]\s+/, ''));
            doc.font('Helvetica').fontSize(10).text(`\u2022 ${bullet}`, { width: textWidth, indent: 12 });
            continue;
        }

        if (/^\d+\.\s/.test(line.trimStart())) {
            writeBody(line.trimStart());
            continue;
        }

        writeBody(line);
    }

    const range = doc.bufferedPageRange();
    for (let p = range.start; p < range.start + range.count; p++) {
        doc.switchToPage(p);
        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        doc.text(
            `Library Management System — Interview Guide  |  Page ${p - range.start + 1} of ${range.count}`,
            doc.page.margins.left,
            doc.page.height - 36,
            { width: textWidth, align: 'center' }
        );
        doc.fillColor('#000000');
    }

    doc.end();
    stream.on('finish', () => {
        console.log('Wrote', outPath);
    });
}

main();
