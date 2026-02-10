const PDFDocument = require('pdfkit');
const crypto = require('crypto');

function generateCertificatePDF(certificateData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
        resolve({ pdfBuffer, hash });
      });
      doc.on('error', reject);

      const data = JSON.parse(certificateData);

      // Header
      doc.fontSize(30).font('Helvetica-Bold').text('CERTIFICATE OF COMPLETION', { align: 'center' });
      doc.moveDown(2);

      // Border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();

      // Content
      doc.fontSize(16).font('Helvetica').text('This certifies that', { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(24).font('Helvetica-Bold').text(data.studentName, { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(16).font('Helvetica').text('has successfully completed the course', { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(20).font('Helvetica-Bold').text(data.courseTitle, { align: 'center' });
      doc.moveDown(1);
      
      doc.fontSize(14).font('Helvetica').text(`Marks: ${data.marks}/100`, { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(12).text(`Course ID: ${data.courseId}`, { align: 'center' });
      doc.moveDown(0.5);
      
      doc.fontSize(12).text(`Issued: ${new Date(data.issuedAt).toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).font('Helvetica-Oblique')
        .text('This certificate is secured by blockchain technology', { align: 'center' });
      doc.fontSize(8).text('Verify authenticity at admin dashboard', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateCertificatePDF };
