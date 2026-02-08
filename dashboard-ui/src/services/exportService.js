import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

// Format duration helper
const formatDuration = (ms) => {
    if (!ms && ms !== 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        // show like 7.8s as in original example when ms < 1000 shows fraction digit
        return `${seconds}.${Math.floor((ms % 1000) / 100)}s`;
    }
};

// ===== EXCEL EXPORT WITH PROFESSIONAL FORMATTING =====
export const exportToExcel = (report) => {
    const workbook = XLSX.utils.book_new();

    // Color definitions (XLSX-style)
    const darkNavyFill = { fgColor: { rgb: 'FF0F1724' } }; // slightly adjusted to match screenshot darker header
    const darkGrayFill = { fgColor: { rgb: 'FF374151' } };
    const lightGrayFill = { fgColor: { rgb: 'FFF3F4F6' } };
    const passedGreenFill = { fgColor: { rgb: 'FFDFF7E8' } }; // light green row fill
    const passedCellFill = { fgColor: { rgb: 'FFD1FAE5' } }; // earlier used
    const failedCellFill = { fgColor: { rgb: 'FFFEF3C7' } }; // NOTE: you had FECACA elsewhere; consistent fallback
    const flakyCellFill = { fgColor: { rgb: 'FFFEF3C7' } };
    const whiteFill = { fgColor: { rgb: 'FFFFFFFF' } };

    const border = {
        left: { style: 'thin', color: { rgb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { rgb: 'FFD1D5DB' } },
        top: { style: 'thin', color: { rgb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { rgb: 'FFD1D5DB' } },
    };

    // ===== CREATE MAIN SHEET =====
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Row 1: Title
    XLSX.utils.sheet_add_aoa(ws, [['Playwright Execution Report']], { origin: 'A1' });
    ws['A1'].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 18 },
        fill: darkNavyFill,
        alignment: { horizontal: 'center', vertical: 'center' },
        border: border,
    };

    // Merge title across columns A:E (0-4)
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

    // Row 2: Empty spacer
    XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A2' });

    // Row 3: Project Information header
    XLSX.utils.sheet_add_aoa(ws, [['Project Information']], { origin: 'A3' });
    ws['A3'].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        fill: darkGrayFill,
        alignment: { horizontal: 'left', vertical: 'center' },
        border: border,
    };
    ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 4 } });

    // Row 4-5: Project details
    const projectName = report?.config?.projects?.[0]?.name || 'Chrome';
    const version = report?.config?.version || 'v1.57.0';
    const generatedDate = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    const totalDuration = formatDuration(report?.stats?.duration || 0);

    XLSX.utils.sheet_add_aoa(
        ws,
        [
            ['Project Name', projectName, '', 'Generated On', generatedDate],
            ['Report Version', version, '', 'Total Duration', totalDuration],
        ],
        { origin: 'A4' }
    );

    // Style project info - Labels (bold, left-aligned)
    ['A4', 'A5'].forEach(cell => {
        ws[cell] = ws[cell] || { v: '' };
        ws[cell].s = {
            font: { bold: true, sz: 10, color: { rgb: 'FF000000' } },
            fill: lightGrayFill,
            border: border,
            alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
        };
    });

    // Values (normal, left-aligned)
    ['B4', 'B5'].forEach(cell => {
        ws[cell] = ws[cell] || { v: '' };
        ws[cell].s = {
            font: { sz: 10, color: { rgb: 'FF000000' } },
            fill: lightGrayFill,
            border: border,
            alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
        };
    });

    // Right side labels (bold, right-aligned)
    ['D4', 'D5'].forEach(cell => {
        ws[cell] = ws[cell] || { v: '' };
        ws[cell].s = {
            font: { bold: true, sz: 10, color: { rgb: 'FF000000' } },
            fill: lightGrayFill,
            border: border,
            alignment: { horizontal: 'right', vertical: 'center', wrapText: false },
        };
    });

    // Right side values (normal, right-aligned)
    ['E4', 'E5'].forEach(cell => {
        ws[cell] = ws[cell] || { v: '' };
        ws[cell].s = {
            font: { sz: 10, color: { rgb: 'FF000000' } },
            fill: lightGrayFill,
            border: border,
            alignment: { horizontal: 'right', vertical: 'center', wrapText: false },
        };
    });

    // C4 and C5 spacers
    ['C4', 'C5'].forEach(cell => {
        ws[cell] = { v: '', t: 's' };
        ws[cell].s = {
            fill: whiteFill,
            border: border,
        };
    });

    // Row 6: Empty spacer
    XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A6' });

    // Row 7: Executive Summary header
    XLSX.utils.sheet_add_aoa(ws, [['Executive Summary']], { origin: 'A7' });
    ws['A7'].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        fill: darkGrayFill,
        alignment: { horizontal: 'left', vertical: 'center' },
        border: border,
    };
    ws['!merges'].push({ s: { r: 6, c: 0 }, e: { r: 6, c: 4 } });

    // Row 8: Summary headers
    XLSX.utils.sheet_add_aoa(
        ws,
        [['Total Tests', 'Passed', 'Failed', 'Flaky', 'Pass Rate']],
        { origin: 'A8' }
    );

    ['A8', 'B8', 'C8', 'D8', 'E8'].forEach(cell => {
        ws[cell].s = {
            font: { bold: true, sz: 10, color: { rgb: 'FF000000' } },
            fill: whiteFill,
            border: border,
            alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
        };
    });

    // Row 9: Summary values
    const totalTests = (report?.stats?.expected || 0) + (report?.stats?.unexpected || 0) + (report?.stats?.skipped || 0) + (report?.stats?.flaky || 0);
    const passRate = totalTests > 0 ? Math.round(((report?.stats?.expected || 0) / totalTests) * 100) : 0;

    XLSX.utils.sheet_add_aoa(
        ws,
        [[totalTests, report?.stats?.expected || 0, report?.stats?.unexpected || 0, report?.stats?.flaky || 0, `${passRate}%`]],
        { origin: 'A9' }
    );

    // Style summary cells
    ws['A9'].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FF000000' } },
        fill: lightGrayFill,
        border: border,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    };

    ws['B9'].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FF16A34A' } }, // GREEN text
        fill: passedCellFill,
        border: border,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    };

    ws['C9'].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FFDC2626' } }, // RED text
        fill: failedCellFill,
        border: border,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    };

    ws['D9'].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FF000000' } },
        fill: flakyCellFill,
        border: border,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    };

    ws['E9'].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FF000000' } },
        fill: lightGrayFill,
        border: border,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    };

    // Row 10: Empty
    XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A10' });

    // Row 11: Test Results Detail header
    XLSX.utils.sheet_add_aoa(ws, [['Test Results Detail']], { origin: 'A11' });
    ws['A11'].s = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 11 },
        fill: darkGrayFill,
        alignment: { horizontal: 'left', vertical: 'center' },
        border: border,
    };
    ws['!merges'].push({ s: { r: 10, c: 0 }, e: { r: 10, c: 4 } });

    // Row 12: Table headers
    XLSX.utils.sheet_add_aoa(
        ws,
        [['Status', 'Test Case Name', 'Suite / File', 'Duration', 'Start Time']],
        { origin: 'A12' }
    );

    ['A12', 'B12', 'C12', 'D12', 'E12'].forEach(cell => {
        ws[cell].s = {
            font: { bold: true, sz: 10, color: { rgb: 'FF000000' } },
            fill: whiteFill,
            border: border,
            alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
        };
    });

    // Row 13+: Test results data
    let rowIdx = 13;
    (report?.suites || []).forEach(suite => {
        (suite.specs || []).forEach(spec => {
            // iterate through tests inside spec
            const test = spec.tests?.[0];
            if (test && test.results && test.results.length) {
                const result = test.results[test.results.length - 1];
                const status = (result?.status || 'UNKNOWN').toString().toUpperCase();
                const testName = spec.title || spec.file || 'Untitled Test';
                const suiteName = spec.file || suite.title || 'Untitled Suite';
                const duration = formatDuration(result?.duration || 0);
                const startTime = result?.startTime
                    ? new Date(result.startTime).toLocaleTimeString('en-GB')
                    : '';

                XLSX.utils.sheet_add_aoa(
                    ws,
                    [[status, testName, suiteName, duration, startTime]],
                    { origin: `A${rowIdx}` }
                );

                // Determine styling based on status
                // Keep a row fill but ensure status TEXT color is red/green as requested
                let rowFill = whiteFill;
                let statusTextColor = { rgb: 'FF000000' }; // default black

                if (status === 'PASSED') {
                    rowFill = passedGreenFill;
                    statusTextColor = { rgb: 'FF16A34A' }; // green
                } else if (status === 'FAILED' || status === 'TIMEDOUT' || status === 'UNEXPECTED') {
                    rowFill = failedCellFill;
                    statusTextColor = { rgb: 'FFDC2626' }; // red
                } else if (status === 'SKIPPED') {
                    rowFill = { fgColor: { rgb: 'FFE5E7EB' } };
                    statusTextColor = { rgb: 'FF6B7280' }; // gray
                } else {
                    // Unknown or other statuses
                    rowFill = whiteFill;
                    statusTextColor = { rgb: 'FF000000' };
                }

                // Status cell - CENTERED with colored text (green/red)
                ws[`A${rowIdx}`].s = {
                    font: { bold: true, sz: 10, color: statusTextColor },
                    fill: rowFill,
                    border: border,
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
                };

                // Test Case Name - LEFT-ALIGNED
                ws[`B${rowIdx}`] = ws[`B${rowIdx}`] || { v: '', t: 's' };
                ws[`B${rowIdx}`].s = {
                    font: { sz: 10, color: { rgb: 'FF000000' } },
                    fill: rowFill,
                    border: border,
                    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
                };

                // Suite / File - LEFT-ALIGNED
                ws[`C${rowIdx}`] = ws[`C${rowIdx}`] || { v: '', t: 's' };
                ws[`C${rowIdx}`].s = {
                    font: { sz: 10, color: { rgb: 'FF000000' } },
                    fill: rowFill,
                    border: border,
                    alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
                };

                // Duration - RIGHT-ALIGNED
                ws[`D${rowIdx}`] = ws[`D${rowIdx}`] || { v: '', t: 's' };
                ws[`D${rowIdx}`].s = {
                    font: { sz: 10, color: { rgb: 'FF000000' } },
                    fill: rowFill,
                    border: border,
                    alignment: { horizontal: 'right', vertical: 'center', wrapText: false },
                };

                // Start Time - RIGHT-ALIGNED
                ws[`E${rowIdx}`] = ws[`E${rowIdx}`] || { v: '', t: 's' };
                ws[`E${rowIdx}`].s = {
                    font: { sz: 10, color: { rgb: 'FF000000' } },
                    fill: rowFill,
                    border: border,
                    alignment: { horizontal: 'right', vertical: 'center', wrapText: false },
                };

                rowIdx++;
            }
        });
    });

    // Set column widths
    ws['!cols'] = [
        { wch: 12 },  // Status
        { wch: 45 },  // Test Case Name
        { wch: 35 },  // Suite / File
        { wch: 12 },  // Duration
        { wch: 15 },  // Start Time
    ];

    // Set row heights (some defaults already; extend for dynamic rows)
    ws['!rows'] = [
        { hpx: 35 },  // Row 1 - Title
        { hpx: 6 },   // Row 2 - Empty
        { hpx: 25 },  // Row 3 - Section header
        { hpx: 22 },  // Row 4
        { hpx: 22 },  // Row 5
        { hpx: 6 },   // Row 6 - Empty
        { hpx: 25 },  // Row 7 - Section header
        { hpx: 22 },  // Row 8 - Summary header
        { hpx: 22 },  // Row 9 - Summary data
        { hpx: 6 },   // Row 10 - Empty
        { hpx: 25 },  // Row 11 - Section header
        { hpx: 22 },  // Row 12 - Table header
        // Additional rows will auto-size; you can push more heights if required
    ];

    XLSX.utils.book_append_sheet(workbook, ws, 'Execution Report');

    // Save workbook
    const filename = `playwright-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
};

// ===== PDF EXPORT WITH COLORED TEXT =====
export const exportToPDF = async (report, chartRefs = {}) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = 15;

    // Dark Header Background
    doc.setFillColor(15, 23, 36); // dark navy
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Playwright Execution Report', pageWidth / 2, 23, { align: 'center' });

    // Header Info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 213, 219);
    const projectName = report?.config?.projects?.[0]?.name || 'Chrome';
    const version = report?.config?.version || 'v1.57.0';
    const generatedDate = new Date().toLocaleString('en-GB');

    doc.text(`Project: ${projectName}  |  Version: ${version}`, margin, 36);
    doc.text(`Generated: ${generatedDate}`, margin, 41);

    yPosition = 55;

    // KPI Cards
    const totalTests = (report?.stats?.expected || 0) + (report?.stats?.unexpected || 0) + (report?.stats?.skipped || 0) + (report?.stats?.flaky || 0);

    const kpis = [
        { label: 'TOTAL TESTS', value: totalTests, color: [107, 114, 128] },
        { label: 'PASSED', value: report?.stats?.expected || 0, color: [22, 163, 74] }, // GREEN
        { label: 'FAILED', value: report?.stats?.unexpected || 0, color: [220, 38, 38] }, // RED
        { label: 'FLAKY', value: report?.stats?.flaky || 0, color: [245, 158, 11] },
    ];

    const cardWidth = (contentWidth - 9) / 4;
    const cardHeight = 22;
    const cardGap = 3;

    kpis.forEach((kpi, index) => {
        const x = margin + index * (cardWidth + cardGap);

        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.rect(x, yPosition, cardWidth, cardHeight, 'FD');

        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.label, x + cardWidth / 2, yPosition + 6.5, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(...kpi.color);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.value.toString(), x + cardWidth / 2, yPosition + 16, { align: 'center' });
    });

    yPosition += cardHeight + 10;

    // Test Results Table
    if (yPosition + 40 < pageHeight - 20) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Test Results', margin, yPosition);
        yPosition += 8;

        const tableData = [['Status', 'Test Name', 'Suite', 'Duration', 'Start Time']];

        (report?.suites || []).forEach(suite => {
            (suite.specs || []).forEach(spec => {
                const test = spec.tests?.[0];
                if (test && test.results && test.results.length) {
                    const result = test.results[test.results.length - 1];
                    tableData.push([
                        (result?.status || 'UNKNOWN').toString().toUpperCase(),
                        spec.title || spec.file || 'Untitled',
                        suite.title || spec.file || 'Untitled Suite',
                        formatDuration(result?.duration || 0),
                        result?.startTime ? new Date(result.startTime).toLocaleTimeString('en-GB') : '',
                    ]);
                }
            });
        });

        autoTable(doc, {
            head: [tableData[0]],
            body: tableData.slice(1),
            startY: yPosition,
            margin: { left: margin, right: margin },
            theme: 'grid',
            headStyles: {
                fillColor: [71, 85, 105],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [31, 41, 55],
            },
            columnStyles: {
                0: { cellWidth: 25, halign: 'center' },
                1: { cellWidth: 70 },
                2: { cellWidth: 50 },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 20, halign: 'right' },
            },

            // <-- Use didParseCell to apply styles BEFORE rendering -->
            didParseCell: (data) => {
                if (data.section !== 'body') return;

                const rawStatus =
                    data.row.raw && data.row.raw[0]
                        ? data.row.raw[0].toString().toUpperCase()
                        : '';

                // Status column text color and boldness
                if (data.column.index === 0) {
                    if (rawStatus === 'PASSED') {
                        data.cell.styles.textColor = [22, 163, 74]; // green
                        data.cell.styles.fontStyle = 'bold';

                    } else if (
                        rawStatus === 'FAILED' ||
                        rawStatus === 'TIMEDOUT' ||
                        rawStatus === 'UNEXPECTED'
                    ) {
                        data.cell.styles.textColor = [220, 38, 38]; // red
                        data.cell.styles.fontStyle = 'bold';

                    } else if (rawStatus === 'SKIPPED') {
                        data.cell.styles.textColor = [107, 114, 128]; // gray
                        data.cell.styles.fontStyle = 'bold';

                    } else {
                        data.cell.styles.textColor = [31, 41, 55]; // default dark
                        data.cell.styles.fontStyle = 'normal';
                    }
                }

                // Row background for visual match with XLSX
                if (rawStatus === 'PASSED') {
                    data.cell.styles.fillColor = [226, 249, 233]; // light green row
                } else if (
                    rawStatus === 'FAILED' ||
                    rawStatus === 'TIMEDOUT' ||
                    rawStatus === 'UNEXPECTED'
                ) {
                    data.cell.styles.fillColor = [254, 202, 202]; // light red row
                }
            },
        });
    }

    // Footer (page numbers)
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    const filename = `playwright-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};
