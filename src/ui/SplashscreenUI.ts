import { TemplateManager } from './TemplateManager.js';
import { logger } from "../utils/logger.js";

export interface SplashscreenUIProps {
  onStartDownload?: () => void;
  onCheckDownloadProgress?: () => void;
  onDownloadProgressUpdate?: (progress: number, loaded: number, total: number) => void;
  onHideSplashScreen?: () => void;
}

export class SplashscreenUI {
  private logger = logger.createModuleLogger('SplashscreenUI');
  private props: SplashscreenUIProps;

  constructor(props: SplashscreenUIProps) {
    this.props = props;
    this.logger.info('SplashscreenUI initialized');
  }

  showSplashScreen(): void {
    const splash = document.getElementById('loading-splash');
    if (splash) {
      splash.style.display = 'flex';
    }
  }

  hideSplashScreen(): void {
    const splash = document.getElementById('loading-splash');
    if (splash) {
      splash.style.display = 'none';
    }
    
    // Notify parent if callback provided
    if (this.props.onHideSplashScreen) {
      this.props.onHideSplashScreen();
    }
  }

  updateSplashStatus(message: string): void {
    const statusText = document.getElementById('splash-status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  showSplashDownloadOption(): void {
    const splashContent = document.querySelector('.splash-content');
    if (!splashContent) return;

    const downloadElement = TemplateManager.createElementFromTemplate('splash-download-template');
    if (!downloadElement) return;

    downloadElement.className = 'splash-download-section';

    // Remove existing download section
    const existingDownload = splashContent.querySelector('.splash-download-section');
    if (existingDownload) {
      existingDownload.remove();
    }

    splashContent.appendChild(downloadElement);

    // Add event listeners
    const downloadBtn = document.getElementById('splash-download-btn');
    const continueBtn = document.getElementById('splash-continue-btn');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        if (this.props.onStartDownload) {
          this.props.onStartDownload();
        }
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.hideSplashScreen();
      });
    }
  }

  showSplashProgress(): void {
    const splashContent = document.querySelector('.splash-content');
    if (!splashContent) return;

    const progressElement = TemplateManager.createElementFromTemplate('splash-progress-template');
    if (!progressElement) return;

    progressElement.className = 'splash-progress-section';

    // Remove existing sections
    const existingDownload = splashContent.querySelector('.splash-download-section');
    const existingProgress = splashContent.querySelector('.splash-progress-section');
    if (existingDownload) existingDownload.remove();
    if (existingProgress) existingProgress.remove();

    splashContent.appendChild(progressElement);

    // Add event listener for check button
    const checkBtn = document.getElementById('splash-check-progress-btn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (this.props.onCheckDownloadProgress) {
          this.props.onCheckDownloadProgress();
        }
      });
    }

    // Listen for download progress updates if callback is provided
    if (this.props.onDownloadProgressUpdate) {
      // Store original callback
      const originalCallback = this.props.onDownloadProgressUpdate;
      
      // Override to call both original and update UI
      const progressWrapper = (progress: number, loaded: number, total: number) => {
        originalCallback(progress, loaded, total);
        this.updateDownloadProgress(progress, loaded, total);
      };
      
      // This callback will be used when download starts
      (window as any).__updateDownloadProgress = progressWrapper;
    }

    // Start with 0% progress
    this.updateDownloadProgress(0, 0, 0);
  }

  showErrorHelp(): void {
    const splashContent = document.querySelector('.splash-content');
    if (!splashContent) return;

    const helpSection = document.createElement('div');
    helpSection.className = 'splash-help-section';
    helpSection.innerHTML = `
      <div class="splash-help-content">
        <button id="splash-continue-anyway-btn" class="splash-continue-button">
          Continue Anyway
        </button>
      </div>
    `;

    // Remove existing help section
    const existingHelp = splashContent.querySelector('.splash-help-section');
    if (existingHelp) {
      existingHelp.remove();
    }

    splashContent.appendChild(helpSection);

    // Add event listener
    const continueBtn = document.getElementById('splash-continue-anyway-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.hideSplashScreen();
      });
    }
  }

  updateDownloadProgress(progress: number, loaded: number, total: number): void {
    const progressFill = document.querySelector('.splash-progress-fill') as HTMLElement;
    const progressStatus = document.querySelector('.splash-progress-status') as HTMLElement;
    
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    
    if (progressStatus) {
      if (progress === 0) {
        progressStatus.textContent = 'Preparing download...';
      } else if (progress === 100) {
        progressStatus.textContent = 'Download complete! Finalizing...';
      } else {
        const loadedMB = Math.round(loaded / (1024 * 1024));
        const totalMB = Math.round(total / (1024 * 1024));
        progressStatus.textContent = `Downloading... ${progress}% (${loadedMB}MB / ${totalMB}MB)`;
      }
    }
  }
}

