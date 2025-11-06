// グローバル変数
let selectedFiles = [];
let processedBlobs = [];
let isCancelled = false;
let currentSize = 1280;
let previewData = [];

// DOM要素
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const fileCount = document.getElementById('fileCount');
const totalSize = document.getElementById('totalSize');
const processBtn = document.getElementById('processBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const cancelBtn = document.getElementById('cancelBtn');
const outputSection = document.getElementById('outputSection');
const summary = document.getElementById('summary');
const downloadBtn = document.getElementById('downloadBtn');
const errorList = document.getElementById('errorList');
const errorItems = document.getElementById('errorItems');
const resetBtn = document.getElementById('resetBtn');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const customSize = document.getElementById('customSize');

// WebP対応チェック
function checkWebPSupport() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const supported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    if (!supported) {
        document.getElementById('webpOption').style.display = 'none';
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    checkWebPSupport();
    
    // プリセットボタン
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSize = parseInt(btn.dataset.size);
            customSize.value = '';
        });
    });
    
    // カスタムサイズ入力
    customSize.addEventListener('input', () => {
        if (customSize.value) {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            currentSize = parseInt(customSize.value) || 1280;
        }
    });
    
    // 画質スライダー
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
    });
    
    // ファイル選択ボタン
    selectBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // ファイル選択
    fileInput.addEventListener('change', handleFileSelect);
    
    // ドラッグ&ドロップ
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFileSelect({ target: { files: e.dataTransfer.files } });
    });
    
    // 処理実行
    processBtn.addEventListener('click', processImages);
    
    // 中止
    cancelBtn.addEventListener('click', () => {
        isCancelled = true;
    });
    
    // ダウンロード
    downloadBtn.addEventListener('click', downloadZip);
    
    // リセット
    resetBtn.addEventListener('click', resetAll);

    // プレビュー更新ボタン
    const updatePreviewBtn = document.getElementById('updatePreviewBtn');
    updatePreviewBtn.addEventListener('click', updatePreview);
    
    // 画質スライダー変更時にプレビュー更新
    qualitySlider.addEventListener('change', () => {
        if (selectedFiles.length > 0) {
            updatePreview();
        }
    });
    
    // 長辺サイズ変更時にプレビュー更新
    document.querySelectorAll('.preset-btn').forEach(btn => {
        const originalClick = btn.onclick;
        btn.addEventListener('click', () => {
            if (selectedFiles.length > 0) {
                setTimeout(updatePreview, 100);
            }
        });
    });
    
    customSize.addEventListener('change', () => {
        if (selectedFiles.length > 0) {
            updatePreview();
        }
    });


});

// ファイル選択処理
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    
    // バリデーション
    if (files.length === 0) return;
    
    if (files.length > 50) {
        alert('⚠️ 1回の処理は最大50枚までです。ファイル数を減らしてください。');
        return;
    }
    
    // フォーマットチェック
    const validFiles = files.filter(f => {
        const ext = f.name.toLowerCase();
        return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png');
    });
    
    if (validFiles.length !== files.length) {
        alert('⚠️ JPEG（.jpg/.jpeg）またはPNG（.png）のみ対応しています。');
    }
    
    // サイズチェック
    const totalBytes = validFiles.reduce((sum, f) => sum + f.size, 0);
    const totalMB = totalBytes / (1024 * 1024);
    
    if (totalMB > 300) {
        alert('⚠️ 合計サイズが300MBを超えています。ファイルを分けて処理してください。');
        return;
    }
    
    selectedFiles = validFiles;
    fileCount.textContent = validFiles.length;
    totalSize.textContent = totalMB.toFixed(2);
    processBtn.disabled = false;

    updatePreview();

}

// 画像処理メイン
async function processImages() {
    if (selectedFiles.length === 0) return;
    
    // UI更新
    processBtn.disabled = true;
    progressContainer.style.display = 'block';
    outputSection.style.display = 'none';
    isCancelled = false;
    processedBlobs = [];
    
    const format = document.querySelector('input[name="format"]:checked').value;
    const quality = parseFloat(qualitySlider.value);
    const noUpscale = document.getElementById('noUpscale').checked;
    
    let successCount = 0;
    let skipCount = 0;
    const errors = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
        if (isCancelled) {
            alert('❌ 処理を中止しました。');
            resetProgress();
            return;
        }
        
        const file = selectedFiles[i];
        progressText.textContent = `処理中: ${i + 1} / ${selectedFiles.length}`;
        progressFill.style.width = `${((i + 1) / selectedFiles.length) * 100}%`;
        
        try {
            const result = await processImage(file, currentSize, format, quality, noUpscale);
            if (result.skipped) {
                skipCount++;
            } else {
                processedBlobs.push(result);
                successCount++;
            }
        } catch (error) {
            errors.push({ name: file.name, error: error.message });
        }
    }
    
    // 完了処理
    showResults(successCount, skipCount, errors);
}

// 個別画像処理
async function processImage(file, targetSize, format, quality, noUpscale) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.onload = async () => {
                try {
                    // サイズ計算
                    let { width, height } = img;
                    const maxDim = Math.max(width, height);
                    
                    // 拡大禁止チェック
                    if (noUpscale && maxDim <= targetSize) {
                        resolve({ skipped: true });
                        return;
                    }
                    
                    // リサイズ計算
                    if (maxDim > targetSize) {
                        const ratio = targetSize / maxDim;
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    
                    // Canvas描画
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Blob生成
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Blob生成失敗'));
                            return;
                        }
                        
                        // ファイル名生成
                        const ext = format.split('/')[1];
                        const baseName = file.name.replace(/\.[^.]+$/, '');
                        const newName = `${baseName}_${targetSize}px.${ext}`;
                        
                        resolve({
                            blob: blob,
                            name: newName,
                            skipped: false
                        });
                    }, format, quality);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('画像読み込み失敗'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('ファイル読み込み失敗'));
        reader.readAsDataURL(file);
    });
}

// 結果表示
function showResults(successCount, skipCount, errors) {
    progressContainer.style.display = 'none';
    outputSection.style.display = 'block';
    
    const avgSize = processedBlobs.length > 0
        ? (processedBlobs.reduce((sum, b) => sum + b.blob.size, 0) / processedBlobs.length / 1024).toFixed(1)
        : 0;
    
    summary.innerHTML = `
        <p>✅ <strong>成功:</strong> ${successCount}枚</p>
        <p>⏭️ <strong>スキップ:</strong> ${skipCount}枚（既に指定サイズ以下）</p>
        <p>❌ <strong>エラー:</strong> ${errors.length}枚</p>
        <p>📊 <strong>平均ファイルサイズ:</strong> 約${avgSize} KB</p>
    `;
    
    if (errors.length > 0) {
        errorList.style.display = 'block';
        errorItems.innerHTML = errors.map(e => `<li>${e.name}: ${e.error}</li>`).join('');
    }
    
    downloadBtn.disabled = processedBlobs.length === 0;
}

// ZIP生成＆ダウンロード
async function downloadZip() {
    if (processedBlobs.length === 0) return;
    
    downloadBtn.disabled = true;
    downloadBtn.textContent = '⏳ ZIP生成中...';
    
    try {
        const zip = new JSZip();
        
        processedBlobs.forEach(item => {
            zip.file(item.name, item.blob);
        });
        
        const blob = await zip.generateAsync({ type: 'blob' });
        
        // ファイル名生成
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/(\d{8})(\d{4})/, '$1_$2');
        const filename = `resized_${dateStr}.zip`;
        
        saveAs(blob, filename);
        
        downloadBtn.textContent = '✅ ダウンロード完了';
        setTimeout(() => {
            downloadBtn.textContent = '💾 ZIPをダウンロード';
            downloadBtn.disabled = false;
        }, 2000);
    } catch (error) {
        alert('❌ ZIP生成に失敗しました: ' + error.message);
        downloadBtn.textContent = '💾 ZIPをダウンロード';
        downloadBtn.disabled = false;
    }
}

// リセット
function resetAll() {
    selectedFiles = [];
    processedBlobs = [];
    fileInput.value = '';
    fileCount.textContent = '0';
    totalSize.textContent = '0';
    processBtn.disabled = true;
    outputSection.style.display = 'none';
    progressContainer.style.display = 'none';
    errorList.style.display = 'none';
    progressFill.style.width = '0%';
}

function resetProgress() {
    progressContainer.style.display = 'none';
    processBtn.disabled = false;
}

// プレビュー更新関数
async function updatePreview() {
    if (selectedFiles.length === 0) return;
    
    const previewSection = document.getElementById('previewSection');
    const previewTableBody = document.getElementById('previewTableBody');
    const beforeTotal = document.getElementById('beforeTotal');
    const afterTotal = document.getElementById('afterTotal');
    const reductionRate = document.getElementById('reductionRate');
    const updatePreviewBtn = document.getElementById('updatePreviewBtn');
    
    // ボタンを無効化
    updatePreviewBtn.disabled = true;
    updatePreviewBtn.textContent = '⏳ 計算中...';
    
    const format = document.querySelector('input[name="format"]:checked').value;
    const quality = parseFloat(qualitySlider.value);
    const noUpscale = document.getElementById('noUpscale').checked;
    
    let totalBefore = 0;
    let totalAfter = 0;
    previewData = [];
    
    // 各ファイルのサイズを予測
    for (const file of selectedFiles) {
        const beforeSize = file.size;
        totalBefore += beforeSize;
        
        try {
            const afterSize = await estimateFileSize(file, currentSize, format, quality, noUpscale);
            totalAfter += afterSize;
            
            const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);
            
            previewData.push({
                name: file.name,
                beforeSize: beforeSize,
                afterSize: afterSize,
                reduction: reduction
            });
        } catch (error) {
            console.error('プレビュー計算エラー:', file.name, error);
        }
    }
    
    // テーブル更新
    previewTableBody.innerHTML = previewData.map(item => `
        <tr>
            <td class="file-name" title="${item.name}">${item.name}</td>
            <td class="size-before">${formatBytes(item.beforeSize)}</td>
            <td class="size-after">${formatBytes(item.afterSize)}</td>
            <td class="reduction ${item.reduction < 0 ? 'negative' : ''}">${item.reduction}%</td>
        </tr>
    `).join('');
    
    // サマリー更新
    beforeTotal.textContent = formatBytes(totalBefore);
    afterTotal.textContent = formatBytes(totalAfter);
    const totalReduction = ((totalBefore - totalAfter) / totalBefore * 100).toFixed(1);
    reductionRate.textContent = `${totalReduction}%`;
    
    // プレビューセクションを表示
    previewSection.style.display = 'block';
    
    // ボタンを再有効化
    updatePreviewBtn.disabled = false;
    updatePreviewBtn.textContent = '🔄 プレビューを更新';
}

// ファイルサイズ推定関数
async function estimateFileSize(file, targetSize, format, quality, noUpscale) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.onload = () => {
                try {
                    let { width, height } = img;
                    const maxDim = Math.max(width, height);
                    
                    // 拡大禁止チェック
                    if (noUpscale && maxDim <= targetSize) {
                        resolve(file.size);
                        return;
                    }
                    
                    // リサイズ計算
                    if (maxDim > targetSize) {
                        const ratio = targetSize / maxDim;
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }
                    
                    // Canvas描画
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Blob生成
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Blob生成失敗'));
                            return;
                        }
                        resolve(blob.size);
                    }, format, quality);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('画像読み込み失敗'));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('ファイル読み込み失敗'));
        reader.readAsDataURL(file);
    });
}

// バイト数を読みやすい形式に変換
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}