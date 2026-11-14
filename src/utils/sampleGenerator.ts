/**
 * Programmatically draws a realistic coffee shop & hardware store receipt
 * onto an offscreen HTML5 <canvas>, exports via canvas.toBlob(), and wraps as a File.
 */
export function generateSampleReceiptImage(): Promise<File> {
  return new Promise((resolve, reject) => {
    const width = 640;
    const height = 880;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable.'));
      return;
    }

    // Soft slate backdrop to give realistic receipt paper contrast
    ctx.fillStyle = '#E8ECF2';
    ctx.fillRect(0, 0, width, height);

    // Thermal paper card
    const padX = 56;
    const padY = 40;
    const paperW = width - padX * 2;
    const paperH = height - padY * 2;

    ctx.fillStyle = '#FCFBF9';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.fillRect(padX, padY, paperW, paperH);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Subtle paper border
    ctx.strokeStyle = '#DCE1E9';
    ctx.lineWidth = 1;
    ctx.strokeRect(padX, padY, paperW, paperH);

    const left = padX + 40;
    const right = padX + paperW - 40;
    const center = width / 2;

    // Merchant Header
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText('VERDANT ROASTERS & LAB', center, padY + 64);

    ctx.fillStyle = '#4B5563';
    ctx.font = '15px "JetBrains Mono", monospace';
    ctx.fillText('418 Valencia St, San Francisco, CA', center, padY + 94);
    ctx.fillText('Tel: (415) 555-0194  |  Store #04', center, padY + 118);

    // Dashed divider
    const drawDivider = (y: number) => {
      ctx.save();
      ctx.strokeStyle = '#9CA3AF';
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.restore();
    };

    drawDivider(padY + 148);

    // Metadata
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1F2937';
    ctx.font = '15px "JetBrains Mono", monospace';
    ctx.fillText('DATE: 2026-11-12  09:42 AM', left, padY + 182);
    ctx.fillText('ORDER: #VR-88412', left, padY + 206);
    ctx.textAlign = 'right';
    ctx.fillText('REG: 02', right, padY + 182);
    ctx.fillText('CASHIER: MAYA K.', right, padY + 206);

    drawDivider(padY + 232);

    // Column Header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText('QTY  ITEM', left, padY + 266);
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT', right, padY + 266);

    // 4 Line Items
    const items = [
      { qty: 2, name: 'Single-Origin Cortado (Oat)', unit: '$5.25', total: '$10.50' },
      { qty: 1, name: 'Cardamom Brioche Bun', unit: '$4.75', total: '$4.75' },
      { qty: 1, name: 'Ethiopia Yirgacheffe 250g', unit: '$19.00', total: '$19.00' },
      { qty: 1, name: 'USB-C Braided Field Cable 2m', unit: '$18.50', total: '$18.50' },
    ];

    let y = padY + 314;
    items.forEach((item) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111827';
      ctx.font = '16px "JetBrains Mono", monospace';
      ctx.fillText(`${item.qty}x   ${item.name}`, left, y);

      ctx.textAlign = 'right';
      ctx.fillText(item.total, right, y);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#6B7280';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText(`     @ ${item.unit} each`, left, y + 22);

      y += 62;
    });

    drawDivider(y + 6);

    // Totals
    y += 44;
    const drawTotalRow = (label: string, value: string, bold = false) => {
      ctx.fillStyle = bold ? '#111827' : '#374151';
      ctx.font = bold
        ? 'bold 20px "JetBrains Mono", monospace'
        : '16px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(label, left, y);
      ctx.textAlign = 'right';
      ctx.fillText(value, right, y);
      y += bold ? 38 : 30;
    };

    drawTotalRow('SUBTOTAL', '$52.75');
    drawTotalRow('CA SALES TAX (8.625%)', '$4.55');

    y += 8;
    drawDivider(y - 16);
    drawTotalRow('TOTAL (USD)', '$57.30', true);

    y += 14;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4B5563';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText('CARD: VISA •••• 4912 (CHIP READ)', left, y);
    ctx.fillText('AUTH CODE: 08391A  |  APPROVED', left, y + 24);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText('Thank you for supporting independent craft.', center, padY + paperH - 36);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate sample receipt PNG.'));
          return;
        }
        const file = new File([blob], 'sample-receipt.png', { type: 'image/png' });
        resolve(file);
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Generates a realistic handwritten-style meeting/architecture note image
 * for testing Handwriting & Notes mode.
 */
export function generateSampleNoteImage(): Promise<File> {
  return new Promise((resolve, reject) => {
    const width = 760;
    const height = 600;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context unavailable.'));
      return;
    }

    // Notebook paper cream tint
    ctx.fillStyle = '#FDFBF4';
    ctx.fillRect(0, 0, width, height);

    // Horizontal ruled lines
    ctx.strokeStyle = '#DCE6F2';
    ctx.lineWidth = 1;
    for (let ly = 84; ly < height - 30; ly += 42) {
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(width, ly);
      ctx.stroke();
    }

    // Margin line
    ctx.strokeStyle = '#F3B4B4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(86, 0);
    ctx.lineTo(86, height);
    ctx.stroke();

    // Ink handwriting style text
    ctx.fillStyle = '#1E293B';
    ctx.font = 'italic 600 26px Georgia, serif';
    ctx.fillText('Q4 Product Sync — OCR Pipeline Notes', 108, 76);

    // Underline
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(108, 82);
    ctx.lineTo(540, 80);
    ctx.stroke();

    const lines = [
      { x: 108, y: 120, text: '• Latency target: < 1.8s per single-page scan' },
      { x: 132, y: 162, text: '- Prioritize client-side image compression > 4MB' },
      { x: 132, y: 204, text: '- Cache last 15 extractions in localStorage' },
      { x: 108, y: 246, text: '• Support 4 core output modes:' },
      { x: 132, y: 288, text: '1. Clean prose (repair column wraps)' },
      { x: 132, y: 330, text: '2. GFM Markdown tables & invoice grids' },
      { x: 132, y: 372, text: '3. Handwriting transcription (whiteboard / notes)' },
      { x: 132, y: 414, text: '4. Strict JSON schema for receipts & expenses' },
      { x: 108, y: 498, text: 'Action: Ship clipboard Ctrl+V paste before Friday!' },
    ];

    ctx.font = 'italic 21px Georgia, serif';
    lines.forEach((line) => {
      ctx.fillText(line.text, line.x, line.y);
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate sample note PNG.'));
          return;
        }
        const file = new File([blob], 'sample-handwritten-note.png', {
          type: 'image/png',
        });
        resolve(file);
      },
      'image/png',
      1.0
    );
  });
}
