import React from 'react';

export default function FileManager() {
  return (
    <div className="filemgr-page">
      <h1 className="filemgr-title">File Manager</h1>

      <hr className="filemgr-divider" />

      {/* Hero section */}
      <div className="filemgr-hero">
        <div className="filemgr-hero-left">
          <div className="filemgr-illustration">
            <svg width="260" height="240" viewBox="0 0 260 240" fill="none">
              {/* Stack of folders/documents */}
              {/* Bottom document */}
              <rect x="50" y="130" width="150" height="90" rx="6" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
              <rect x="65" y="145" width="80" height="4" rx="2" fill="#93c5fd"/>
              <rect x="65" y="155" width="60" height="4" rx="2" fill="#bae6fd"/>
              <rect x="65" y="165" width="100" height="4" rx="2" fill="#93c5fd"/>
              <rect x="65" y="175" width="50" height="4" rx="2" fill="#bae6fd"/>
              <rect x="65" y="185" width="75" height="4" rx="2" fill="#93c5fd"/>
              <rect x="65" y="195" width="90" height="4" rx="2" fill="#bae6fd"/>

              {/* Middle document */}
              <rect x="60" y="100" width="150" height="90" rx="6" fill="#e0f2fe" stroke="#3b82f6" strokeWidth="1.5"/>
              <rect x="75" y="115" width="80" height="4" rx="2" fill="#93c5fd"/>
              <rect x="75" y="125" width="60" height="4" rx="2" fill="#bae6fd"/>
              <rect x="75" y="135" width="100" height="4" rx="2" fill="#93c5fd"/>
              <rect x="75" y="145" width="50" height="4" rx="2" fill="#bae6fd"/>
              <rect x="75" y="155" width="75" height="4" rx="2" fill="#93c5fd"/>

              {/* Top document */}
              <rect x="70" y="70" width="150" height="90" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5"/>
              <rect x="85" y="85" width="80" height="4" rx="2" fill="#93c5fd"/>
              <rect x="85" y="95" width="60" height="4" rx="2" fill="#bae6fd"/>
              <rect x="85" y="105" width="100" height="4" rx="2" fill="#93c5fd"/>
              <rect x="85" y="115" width="50" height="4" rx="2" fill="#bae6fd"/>
              <rect x="85" y="125" width="75" height="4" rx="2" fill="#93c5fd"/>

              {/* Checkmark circle */}
              <circle cx="195" cy="145" r="22" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5"/>
              <path d="M183 145l8 8 16-16" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>

              {/* Decorative elements */}
              <circle cx="65" cy="55" r="5" fill="none" stroke="#93c5fd" strokeWidth="1.5"/>
              <circle cx="85" cy="48" r="3" fill="#bae6fd"/>

              {/* Plus signs */}
              <g stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                <line x1="200" y1="85" x2="200" y2="95"/><line x1="195" y1="90" x2="205" y2="90"/>
                <line x1="140" y1="210" x2="140" y2="218"/><line x1="136" y1="214" x2="144" y2="214"/>
              </g>

              {/* Dots */}
              <circle cx="72" cy="205" r="2.5" fill="#93c5fd"/>
              <circle cx="82" cy="195" r="2" fill="#bae6fd"/>
            </svg>
          </div>
        </div>

        <div className="filemgr-hero-right">
          <h2 className="filemgr-hero-title">Add files your team can access</h2>
          <p className="filemgr-hero-desc">
            Store your team's important documents so they can easily
            be added to proposals, templates, and more
          </p>

          <div className="filemgr-btn-row">
            <button className="filemgr-folder-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Create a folder
            </button>
            <button className="filemgr-upload-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload files
            </button>
          </div>
        </div>
      </div>

      {/* Upload dropzone */}
      <div className="filemgr-dropzone">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        <p className="filemgr-dropzone-title">Upload files</p>
        <p className="filemgr-dropzone-desc">
          Drag and drop or <a href="#upload" className="filemgr-link">click here</a> to upload files
        </p>
      </div>

      <p className="filemgr-footer-note">
        File uploads may be a maximum size of 20MB per file. Supported file types: pdf, jpg, jpeg, png, heic
      </p>
    </div>
  );
}
