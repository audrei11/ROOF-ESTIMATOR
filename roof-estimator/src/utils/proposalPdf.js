import { jsPDF } from 'jspdf';

/* ═══════════════════════════════════════════════════════════════════════════
   Signed Proposal PDF Generator
   ─────────────────────────────────────────────────────────────────────────
   Generates a 2-page PDF:
     Page 1 — Proposal details + line items
     Page 2 — Terms & conditions + signature
   ═══════════════════════════════════════════════════════════════════════════ */

export async function generateSignedProposalPdf(proposal) {
  const pdf = new jsPDF('p', 'mm', 'a4'); // 210 x 297 mm
  const W = 210;
  const margin = 20;
  const cw = W - margin * 2; // content width
  let y = 0; // current y position

  /* ═══ PAGE 1 — Proposal Details ══════════════════════════════════════ */

  // Header bar
  pdf.setFillColor(0, 71, 171); // BLUE
  pdf.rect(0, 0, W, 28, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text('T', margin, 18);
  pdf.setFontSize(14);
  pdf.text('  Ahjin Roofing', margin + 8, 18);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Roofing Proposal', W - margin, 18, { align: 'right' });

  y = 40;

  // Proposal info
  pdf.setTextColor(107, 114, 128); // GRAY
  pdf.setFontSize(9);
  pdf.text('Prepared for', margin, y);
  pdf.text('Property Address', margin + 60, y);
  pdf.text('Date', W - margin, y, { align: 'right' });
  y += 5;
  pdf.setTextColor(30, 41, 59); // DARK
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(proposal.customer_name || '—', margin, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(proposal.address || '—', margin + 60, y);
  pdf.text(new Date(proposal.created_at).toLocaleDateString(), W - margin, y, { align: 'right' });

  y += 5;
  if (proposal.total_area > 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Roof: ${Math.round(proposal.total_area).toLocaleString()} sq ft  |  Pitch: ${proposal.pitch || 'N/A'}`, margin, y);
  }

  y += 8;
  // Divider
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, y, W - margin, y);
  y += 8;

  // Pricing options
  const options = proposal.options || [];
  const selectedIdx = proposal.selected_option ?? 0;

  for (let oi = 0; oi < options.length; oi++) {
    const opt = options[oi];
    const isSelected = oi === selectedIdx;

    // Option header
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(isSelected ? 0 : 107, isSelected ? 71 : 114, isSelected ? 171 : 128);
    const optLabel = `${opt.name}${isSelected ? '  ✓ Selected' : ''}`;
    pdf.text(optLabel, margin, y);
    y += 6;

    // Table header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y - 3, cw, 7, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(107, 114, 128);
    pdf.text('Description', margin + 2, y + 1);
    pdf.text('Qty', margin + cw * 0.55, y + 1);
    pdf.text('Unit Price', margin + cw * 0.7, y + 1);
    pdf.text('Total', margin + cw * 0.88, y + 1);
    y += 7;

    // Line items
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(30, 41, 59);

    const lineItems = opt.lineItems || [];
    let optTotal = 0;

    for (const li of lineItems) {
      const lineTotal = (li.qty || 0) * (li.unitPrice || 0);
      optTotal += lineTotal;

      pdf.text(li.description || '—', margin + 2, y);
      pdf.text(`${li.qty} ${li.unit || ''}`, margin + cw * 0.55, y);
      pdf.text(`$${Number(li.unitPrice).toFixed(2)}`, margin + cw * 0.7, y);
      pdf.text(`$${lineTotal.toFixed(2)}`, margin + cw * 0.88, y);

      y += 5;

      // Page overflow check
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    }

    // Option total
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, y, W - margin, y);
    y += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`Total: $${optTotal.toFixed(2)}`, W - margin, y, { align: 'right' });
    y += 10;

    if (y > 260) {
      pdf.addPage();
      y = 20;
    }
  }

  /* ═══ PAGE 2 — Terms & Signature ═════════════════════════════════════ */

  pdf.addPage();
  y = 20;

  // Terms header
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('Terms & Conditions', margin, y);
  y += 8;

  // Terms body
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);

  const terms = (proposal.terms || '').split('\n');
  for (const line of terms) {
    const wrapped = pdf.splitTextToSize(line, cw);
    for (const wl of wrapped) {
      pdf.text(wl, margin, y);
      y += 4.5;
      if (y > 260) { pdf.addPage(); y = 20; }
    }
    y += 1;
  }

  // Notes
  if (proposal.notes) {
    y += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text('Additional Notes', margin, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99);
    const noteLines = pdf.splitTextToSize(proposal.notes, cw);
    for (const nl of noteLines) {
      pdf.text(nl, margin, y);
      y += 4.5;
    }
  }

  // Signature section
  y += 10;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, y, W - margin, y);
  y += 10;

  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('Electronic Signature', margin, y);
  y += 8;

  // Signature image
  if (proposal.signature_image) {
    try {
      pdf.addImage(proposal.signature_image, 'PNG', margin, y, 70, 25);
    } catch (e) {
      pdf.setFontSize(10);
      pdf.text('[Signature on file]', margin, y + 12);
    }
    y += 28;
  }

  // Signature line
  pdf.setDrawColor(30, 41, 59);
  pdf.line(margin, y, margin + 80, y);
  y += 5;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text(`Name: ${proposal.signer_name || proposal.customer_name || ''}`, margin, y);
  y += 4.5;
  pdf.text(`Date: ${proposal.signed_at ? new Date(proposal.signed_at).toLocaleString() : ''}`, margin, y);
  y += 4.5;
  pdf.text(`Proposal ID: ${proposal.id}`, margin, y);

  // Footer
  y += 15;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(margin, y, W - margin, y);
  y += 6;
  pdf.setFontSize(7.5);
  pdf.setTextColor(156, 163, 175);
  pdf.text('This document was electronically signed via Ahjin Roofing Proposals.', margin, y);
  pdf.text(`Copyright © ${new Date().getFullYear()} Ahjin Roofing | All rights reserved.`, margin, y + 3.5);

  // Save
  const fileName = `Ahjin_Roofing_Proposal_${(proposal.address || proposal.id).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  pdf.save(fileName);
  return pdf;
}
