let uploadedImage = null;
let badgeTemplate = null;
let userName = '';

// Load badge template
const templateImg = new Image();
templateImg.crossOrigin = 'anonymous';
templateImg.src = 'badge.png';
templateImg.onload = () => {
    badgeTemplate = templateImg;
    console.log('Badge template loaded successfully');
};
templateImg.onerror = () => {
    console.error('Failed to load badge template');
};

// Page Navigation
function goToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// File Upload Handler
document.getElementById('photo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('⚠️ Please upload a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('⚠️ Image size should be less than 5MB');
            return;
        }

        document.getElementById('fileName').textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                uploadedImage = img;
                document.getElementById('previewImg').src = event.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };
            img.onerror = () => {
                alert('⚠️ Failed to load image. Please try another image.');
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            alert('⚠️ Failed to read file. Please try again.');
        };
        reader.readAsDataURL(file);
    }
});

// Generate and Preview
function generateAndPreview() {
    const name = document.getElementById('name').value.trim();
    
    if (!name) {
        alert('⚠️ Please enter your name');
        document.getElementById('name').focus();
        return;
    }
    
    if (!uploadedImage) {
        alert('⚠️ Please upload your photo');
        return;
    }

    if (!badgeTemplate) {
        alert('⚠️ Badge template is still loading. Please wait a moment and try again.');
        return;
    }

    userName = name;
    generateBadge(name, uploadedImage);
    goToPage('previewPage');
}

// Generate Badge on Canvas with Responsive Text
function generateBadge(name, image) {
    const canvas = document.getElementById('badgeCanvas');
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw badge template
    if (badgeTemplate) {
        ctx.drawImage(badgeTemplate, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: white background if template not loaded
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw circular photo with shadow
const photoX = 400;
const photoY = 438;
const photoRadius = 145;

ctx.save();

// Add shadow BEFORE clipping
ctx.shadowColor = 'rgba(149, 4, 135, 1)';  // Black shadow
ctx.shadowBlur = 20;                      // Blur amount
ctx.shadowOffsetX = 0;                    // Horizontal offset
ctx.shadowOffsetY = 5;                    // Vertical offset

ctx.beginPath();
ctx.arc(photoX, photoY, photoRadius, 0, Math.PI * 2);
ctx.closePath();
ctx.clip();

// Calculate image dimensions to fill the circle
const scale = Math.max(photoRadius * 2 / image.width, photoRadius * 2 / image.height);
const scaledWidth = image.width * scale;
const scaledHeight = image.height * scale;
const imgX = photoX - scaledWidth / 2;
const imgY = photoY - scaledHeight / 2;

ctx.drawImage(image, imgX, imgY, scaledWidth, scaledHeight);
ctx.restore();

// Draw name in white (RESPONSIVE TEXT SIZE)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textX = 400;
    const textY = 612;
    const maxWidth = 520; // Maximum width for the text (fixed)
    
    // Calculate responsive font size
    let fontSize = 34;
    ctx.font = `bold ${fontSize}px Arial`;
    let textWidth = ctx.measureText(name).width;
    
    // Reduce font size if text is too wide
    while (textWidth > maxWidth && fontSize > 16) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px Arial`;
        textWidth = ctx.measureText(name).width;
    }

    // Draw white text with responsive size
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(name, textX, textY);
    ctx.restore();
}

// Download Badge - FIXED VERSION
function downloadBadge() {
    const canvas = document.getElementById('badgeCanvas');
    
    if (!canvas) {
        alert('⚠️ Badge canvas not found. Please try again.');
        return;
    }

    try {
        // Create safe filename
        const safeName = (userName || 'AWS-Community')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9-_]/g, '')
            .substring(0, 50); // Limit length

        const fileName = `AWS-Badge-${safeName || 'Guest'}.png`;

        // Method 1: Try toBlob (Modern browsers)
        if (canvas.toBlob) {
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Failed to create blob');
                    fallbackDownload(canvas, fileName);
                    return;
                }

                // Create download link
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = fileName;
                downloadLink.style.display = 'none';
                
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(url);
                }, 100);

                // Success message
                setTimeout(() => {
                    alert('✅ Badge downloaded successfully!');
                }, 200);
            }, 'image/png', 1.0);
        } else {
            // Fallback for older browsers
            fallbackDownload(canvas, fileName);
        }
    } catch (error) {
        console.error('Download error:', error);
        alert('⚠️ Download failed. Please try again or use a different browser.');
    }
}

// Fallback download method using toDataURL
function fallbackDownload(canvas, fileName) {
    try {
        const dataURL = canvas.toDataURL('image/png', 1.0);
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setTimeout(() => {
            alert('✅ Badge downloaded successfully!');
        }, 200);
    } catch (error) {
        console.error('Fallback download error:', error);
        alert('⚠️ Download failed. Your browser may be blocking the download.');
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    console.log('Page loaded successfully');
});