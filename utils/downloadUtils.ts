
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadContentAsPdf = async (elementId: string, baseFilename: string, pdfTitle?: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    alert(`Error: Could not find content to download for ${baseFilename}.`);
    return;
  }

  const contentToRender = document.createElement('div');
  if (pdfTitle) {
    const titleElement = document.createElement('h2');
    titleElement.innerText = pdfTitle;
    titleElement.style.fontSize = '28px'; 
    titleElement.style.fontWeight = 'bold'; 
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '25px'; 
    titleElement.style.color = '#1e293b'; // slate-800 for a strong, professional title
    titleElement.style.fontFamily = 'Inter, Arial, sans-serif'; // Ensure consistent font
    contentToRender.appendChild(titleElement);
  }
  
  const clonedContent = input.cloneNode(true) as HTMLElement;
  // Apply a base font family to the cloned content for PDF consistency
  clonedContent.style.fontFamily = 'Inter, Arial, sans-serif';
  clonedContent.style.color = '#334155'; // slate-700 for body text in PDF
  
  // Ensure prose styles are somewhat emulated if Tailwind prose class was used
  const proseElements = clonedContent.querySelectorAll('.prose, .prose-lg, .prose-xl') as NodeListOf<HTMLElement>;
  proseElements.forEach(el => {
    el.style.maxWidth = 'none'; // Remove max-width for PDF full width
  });
  const allTextElements = clonedContent.querySelectorAll('p, li, span, div, h1, h2, h3, h4, h5, h6, strong, em, b, i, td, th') as NodeListOf<HTMLElement>;
  allTextElements.forEach(el => {
    // If the element's color is very light (like white, if it was on a dark background), change it.
    // This is a basic check. More sophisticated checks might be needed for complex UIs.
    const currentColor = window.getComputedStyle(el).color;
    if (currentColor === 'rgb(255, 255, 255)' || currentColor === 'rgb(248, 250, 252)' /* slate-50 */ || currentColor === 'rgb(241, 245, 249)' /* slate-100 */) {
        el.style.color = '#334155'; // Default to slate-700
    }
    // Attempt to ensure font is inherited
    if (!el.style.fontFamily) {
        el.style.fontFamily = 'Inter, Arial, sans-serif';
    }
  });


  contentToRender.appendChild(clonedContent);

  contentToRender.style.position = 'absolute';
  contentToRender.style.left = '-9999px'; 
  contentToRender.style.width = input.offsetWidth > 0 ? input.offsetWidth + 'px' : '1024px'; // Fallback width
  contentToRender.style.padding = '20px'; // Add some padding for canvas rendering
  contentToRender.style.backgroundColor = '#ffffff'; // Ensure white background for canvas
  document.body.appendChild(contentToRender);


  try {
    const canvas = await html2canvas(contentToRender, {
      scale: 2, 
      useCORS: true,
      logging: false,
      width: contentToRender.scrollWidth,
      height: contentToRender.scrollHeight,
      windowWidth: contentToRender.scrollWidth,
      windowHeight: contentToRender.scrollHeight,
      backgroundColor: '#ffffff', // Explicit white background
    });
    
    document.body.removeChild(contentToRender);

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const aspectRatio = imgProps.width / imgProps.height;

    let imgWidth = pdfWidth - 20; 
    let imgHeight = imgWidth / aspectRatio;
    
    let currentY = 10; 

    if (imgHeight > pdfHeight - 20) { 
        let remainingHeight = imgProps.height;
        let yCanvas = 0; 

        while (remainingHeight > 0) {
            let pageCanvasPixelHeight = Math.min(
                remainingHeight,
                ( (pdfHeight - currentY - 10) / ( (pdfWidth - 20) / imgProps.width ) )
            );


            const chunkCanvas = document.createElement('canvas');
            chunkCanvas.width = imgProps.width; 
            chunkCanvas.height = pageCanvasPixelHeight; 
            const chunkCtx = chunkCanvas.getContext('2d');
            if (chunkCtx) {
                chunkCtx.drawImage(canvas, 0, yCanvas, imgProps.width, pageCanvasPixelHeight, 0, 0, imgProps.width, pageCanvasPixelHeight);
                const chunkImgData = chunkCanvas.toDataURL('image/png');
                
                const chunkImgProps = pdf.getImageProperties(chunkImgData);
                let chunkDisplayHeight = (pdfWidth - 20) / (chunkImgProps.width / chunkImgProps.height);


                if (currentY + chunkDisplayHeight > pdfHeight -10 && currentY > 10) { 
                     pdf.addPage();
                     currentY = 10;
                }
                pdf.addImage(chunkImgData, 'PNG', 10, currentY, pdfWidth - 20, chunkDisplayHeight);
                
                yCanvas += pageCanvasPixelHeight;
                remainingHeight -= pageCanvasPixelHeight;
                currentY += chunkDisplayHeight + 5; 
                
                if (remainingHeight > 0 && (currentY > pdfHeight - 20 || yCanvas < imgProps.height )) {
                     if (currentY > pdfHeight - 20) { 
                        pdf.addPage();
                        currentY = 10;
                     }
                }
            } else {
                 console.error("Could not get context for chunk canvas");
                 remainingHeight = 0; 
            }
        }

    } else { 
        const xOffset = (pdfWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, currentY, imgWidth, imgHeight);
    }
    
    const sanitizedFilename = baseFilename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    pdf.save(`${sanitizedFilename}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF for ${baseFilename}. See console for details.`);
    if (document.body.contains(contentToRender)) {
      document.body.removeChild(contentToRender); 
    }
  }
};