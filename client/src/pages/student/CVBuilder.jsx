import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CV_API = 'http://localhost:5001/api/cv';

const emptyCV = {
  name: '', email: '', phone: '', address: '', linkedin: '',
  objective: '', photo: '',
  education: [{ degree: '', institution: '', year: '', gpa: '' }],
  experience: [{ title: '', company: '', duration: '', description: '' }],
  skills: '', softSkills: '',
  projects: [{ name: '', description: '', tech: '' }],
  certifications: [{ name: '', institution: '', year: '' }],
  references: [{ name: '', designation: '', organization: '', contact: '' }],
};

// ─── TEMPLATE 1: Classic Blue ───────────────────────────────────────────────
function ClassicTemplate({ cv, headerColor }) {
  const sh = {
    fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a',
    textTransform: 'uppercase', letterSpacing: '1px',
    borderBottom: '2px solid #ea580c', paddingBottom: '4px',
    marginBottom: '8px', display: 'block', width: '100%'
  };
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#ffffff', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
      <div style={{ background: headerColor, padding: '28px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '20px' }}>
        {cv.photo && <img src={cv.photo} alt="profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', objectFit: 'cover', flexShrink: 0 }} />}
        <div>
          <h1 style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{cv.name || 'Your Name'}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '8px' }}>
            {cv.email    && <span style={{ color: '#bfdbfe', fontSize: '11px' }}>✉ {cv.email}</span>}
            {cv.phone    && <span style={{ color: '#bfdbfe', fontSize: '11px' }}>☎ {cv.phone}</span>}
            {cv.address  && <span style={{ color: '#bfdbfe', fontSize: '11px' }}>⌂ {cv.address}</span>}
            {cv.linkedin && <span style={{ color: '#bfdbfe', fontSize: '11px' }}>in {cv.linkedin}</span>}
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 40px', boxSizing: 'border-box' }}>
        {cv.objective && <div style={{ marginBottom: '16px' }}><h2 style={sh}>Career Objective</h2><p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.7', margin: 0, textAlign: 'justify' }}>{cv.objective}</p></div>}
        {cv.education.some(e => e.degree) && <div style={{ marginBottom: '16px' }}><h2 style={sh}>Education</h2>{cv.education.filter(e => e.degree).map((edu, i) => (<div key={i} style={{ marginBottom: '8px' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0, flex: 1 }}>{edu.degree}</p><p style={{ fontSize: '12px', color: '#6b7280', margin: 0, marginLeft: '12px' }}>{edu.year}</p></div><p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0' }}>{edu.institution}</p>{edu.gpa && <p style={{ fontSize: '12px', color: '#ea580c', margin: 0 }}>GPA: {edu.gpa}</p>}</div>))}</div>}
        {cv.experience.some(e => e.title) && <div style={{ marginBottom: '16px' }}><h2 style={sh}>Experience</h2>{cv.experience.filter(e => e.title).map((exp, i) => (<div key={i} style={{ marginBottom: '8px' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0, flex: 1 }}>{exp.title}</p><p style={{ fontSize: '12px', color: '#6b7280', margin: 0, marginLeft: '12px' }}>{exp.duration}</p></div><p style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600', margin: '2px 0' }}>{exp.company}</p>{exp.description && <p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0', lineHeight: '1.6', textAlign: 'justify' }}>{exp.description}</p>}</div>))}</div>}
        {cv.skills && <div style={{ marginBottom: '16px' }}><h2 style={sh}>Technical Skills</h2><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{cv.skills.split(',').map((s, i) => (<span key={i} style={{ padding: '3px 10px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '11px' }}>{s.trim()}</span>))}</div></div>}
        {cv.softSkills && <div style={{ marginBottom: '16px' }}><h2 style={sh}>Soft Skills</h2><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{cv.softSkills.split(',').map((s, i) => (<span key={i} style={{ padding: '3px 10px', background: '#ffedd5', color: '#9a3412', borderRadius: '4px', fontSize: '11px' }}>{s.trim()}</span>))}</div></div>}
        {cv.projects.some(p => p.name) && <div style={{ marginBottom: '16px' }}><h2 style={sh}>Projects</h2>{cv.projects.filter(p => p.name).map((proj, i) => (<div key={i} style={{ marginBottom: '8px' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{proj.name}</p>{proj.tech && <p style={{ fontSize: '12px', color: '#ea580c', margin: '2px 0' }}>Tech: {proj.tech}</p>}{proj.description && <p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0', textAlign: 'justify' }}>{proj.description}</p>}</div>))}</div>}
        {cv.certifications?.some(c => c.name) && <div style={{ marginBottom: '16px' }}><h2 style={sh}>Courses & Certifications</h2>{cv.certifications.filter(c => c.name).map((cert, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><div style={{ flex: 1 }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{cert.name}</p><p style={{ fontSize: '12px', color: '#4b5563', margin: '1px 0' }}>{cert.institution}</p></div><p style={{ fontSize: '12px', color: '#ea580c', margin: 0, marginLeft: '12px' }}>{cert.year}</p></div>))}</div>}
        {cv.references?.some(r => r.name) && <div style={{ marginBottom: '16px' }}><h2 style={sh}>References</h2><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>{cv.references.filter(r => r.name).map((ref, i) => (<div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{ref.name}</p><p style={{ fontSize: '12px', color: '#ea580c', margin: '2px 0' }}>{ref.designation}</p><p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0' }}>{ref.organization}</p><p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{ref.contact}</p></div>))}</div></div>}
      </div>
    </div>
  );
}

// ─── TEMPLATE 2: Modern Sidebar ────────────────────────────────────────────
function ModernTemplate({ cv, headerColor }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#ffffff', width: '210mm', minHeight: '297mm', boxSizing: 'border-box', display: 'flex' }}>
      <div style={{ width: '35%', background: headerColor, padding: '30px 20px', boxSizing: 'border-box', flexShrink: 0 }}>
        {cv.photo && <div style={{ textAlign: 'center', marginBottom: '16px' }}><img src={cv.photo} alt="profile" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', objectFit: 'cover' }} /></div>}
        <h1 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', textAlign: 'center' }}>{cv.name || 'Your Name'}</h1>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', margin: '12px 0' }}></div>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Contact</h3>
          {cv.email && <p style={{ color: '#bfdbfe', fontSize: '10px', margin: '4px 0' }}>✉ {cv.email}</p>}
          {cv.phone && <p style={{ color: '#bfdbfe', fontSize: '10px', margin: '4px 0' }}>☎ {cv.phone}</p>}
          {cv.address && <p style={{ color: '#bfdbfe', fontSize: '10px', margin: '4px 0' }}>⌂ {cv.address}</p>}
          {cv.linkedin && <p style={{ color: '#bfdbfe', fontSize: '10px', margin: '4px 0' }}>in {cv.linkedin}</p>}
        </div>
        {cv.skills && <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Technical Skills</h3>
          {cv.skills.split(',').map((s, i) => (<div key={i} style={{ marginBottom: '4px' }}><p style={{ color: '#ffffff', fontSize: '10px', margin: '0 0 2px 0' }}>{s.trim()}</p><div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}><div style={{ height: '3px', background: '#ffffff', borderRadius: '2px', width: '75%' }}></div></div></div>))}
        </div>}
        {cv.softSkills && <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 0' }}>Soft Skills</h3>
          {cv.softSkills.split(',').map((s, i) => (<p key={i} style={{ color: '#bfdbfe', fontSize: '10px', margin: '3px 0' }}>• {s.trim()}</p>))}
        </div>}
      </div>
      <div style={{ flex: 1, padding: '30px 24px', boxSizing: 'border-box' }}>
        {cv.objective && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '12px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${headerColor}`, paddingBottom: '3px', marginBottom: '6px' }}>Career Objective</h2><p style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.6', margin: 0, textAlign: 'justify' }}>{cv.objective}</p></div>}
        {cv.education.some(e => e.degree) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '12px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${headerColor}`, paddingBottom: '3px', marginBottom: '6px' }}>Education</h2>{cv.education.filter(e => e.degree).map((edu, i) => (<div key={i} style={{ marginBottom: '8px' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', margin: 0, flex: 1 }}>{edu.degree}</p><p style={{ fontSize: '11px', color: '#6b7280', margin: 0, marginLeft: '8px' }}>{edu.year}</p></div><p style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0' }}>{edu.institution}</p>{edu.gpa && <p style={{ fontSize: '11px', color: headerColor, margin: 0 }}>GPA: {edu.gpa}</p>}</div>))}</div>}
        {cv.experience.some(e => e.title) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '12px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${headerColor}`, paddingBottom: '3px', marginBottom: '6px' }}>Experience</h2>{cv.experience.filter(e => e.title).map((exp, i) => (<div key={i} style={{ marginBottom: '8px' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', margin: 0, flex: 1 }}>{exp.title}</p><p style={{ fontSize: '11px', color: '#6b7280', margin: 0, marginLeft: '8px' }}>{exp.duration}</p></div><p style={{ fontSize: '11px', color: headerColor, fontWeight: '600', margin: '2px 0' }}>{exp.company}</p>{exp.description && <p style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0', lineHeight: '1.5', textAlign: 'justify' }}>{exp.description}</p>}</div>))}</div>}
        {cv.projects.some(p => p.name) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '12px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${headerColor}`, paddingBottom: '3px', marginBottom: '6px' }}>Projects</h2>{cv.projects.filter(p => p.name).map((proj, i) => (<div key={i} style={{ marginBottom: '8px' }}><p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{proj.name}</p>{proj.tech && <p style={{ fontSize: '11px', color: headerColor, margin: '2px 0' }}>Tech: {proj.tech}</p>}{proj.description && <p style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0', textAlign: 'justify' }}>{proj.description}</p>}</div>))}</div>}
        {cv.certifications?.some(c => c.name) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '12px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${headerColor}`, paddingBottom: '3px', marginBottom: '6px' }}>Certifications</h2>{cv.certifications.filter(c => c.name).map((cert, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><div style={{ flex: 1 }}><p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{cert.name}</p><p style={{ fontSize: '11px', color: '#4b5563', margin: '1px 0' }}>{cert.institution}</p></div><p style={{ fontSize: '11px', color: headerColor, margin: 0, marginLeft: '8px' }}>{cert.year}</p></div>))}</div>}
        {cv.references?.some(r => r.name) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '12px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${headerColor}`, paddingBottom: '3px', marginBottom: '6px' }}>References</h2><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>{cv.references.filter(r => r.name).map((ref, i) => (<div key={i} style={{ background: '#f9fafb', borderRadius: '6px', padding: '8px' }}><p style={{ fontSize: '11px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{ref.name}</p><p style={{ fontSize: '11px', color: headerColor, margin: '2px 0' }}>{ref.designation}</p><p style={{ fontSize: '11px', color: '#4b5563', margin: '1px 0' }}>{ref.organization}</p><p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{ref.contact}</p></div>))}</div></div>}
      </div>
    </div>
  );
}

// ─── TEMPLATE 3: Minimal Clean ─────────────────────────────────────────────
function MinimalTemplate({ cv, headerColor }) {
  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#ffffff', width: '210mm', minHeight: '297mm', boxSizing: 'border-box', padding: '40px' }}>
      <div style={{ borderBottom: `3px solid ${headerColor}`, paddingBottom: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        {cv.photo && <img src={cv.photo} alt="profile" style={{ width: '75px', height: '75px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: `2px solid ${headerColor}` }} />}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 6px 0', letterSpacing: '1px' }}>{cv.name || 'Your Name'}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {cv.email    && <span style={{ fontSize: '11px', color: '#6b7280' }}>✉ {cv.email}</span>}
            {cv.phone    && <span style={{ fontSize: '11px', color: '#6b7280' }}>☎ {cv.phone}</span>}
            {cv.address  && <span style={{ fontSize: '11px', color: '#6b7280' }}>⌂ {cv.address}</span>}
            {cv.linkedin && <span style={{ fontSize: '11px', color: '#6b7280' }}>in {cv.linkedin}</span>}
          </div>
        </div>
      </div>
      {cv.objective && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '13px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px 0' }}>Profile</h2><p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7', margin: 0, textAlign: 'justify' }}>{cv.objective}</p></div>}
      {cv.education.some(e => e.degree) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '13px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px 0' }}>Education</h2>{cv.education.filter(e => e.degree).map((edu, i) => (<div key={i} style={{ marginBottom: '8px', paddingLeft: '12px', borderLeft: `2px solid ${headerColor}` }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{edu.degree}</p><p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{edu.year}</p></div><p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0', fontStyle: 'italic' }}>{edu.institution}</p>{edu.gpa && <p style={{ fontSize: '11px', color: headerColor, margin: 0 }}>GPA: {edu.gpa}</p>}</div>))}</div>}
      {cv.experience.some(e => e.title) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '13px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px 0' }}>Experience</h2>{cv.experience.filter(e => e.title).map((exp, i) => (<div key={i} style={{ marginBottom: '10px', paddingLeft: '12px', borderLeft: `2px solid ${headerColor}` }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{exp.title}</p><p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{exp.duration}</p></div><p style={{ fontSize: '11px', color: headerColor, fontStyle: 'italic', margin: '2px 0' }}>{exp.company}</p>{exp.description && <p style={{ fontSize: '11px', color: '#4b5563', margin: '3px 0', lineHeight: '1.5', textAlign: 'justify' }}>{exp.description}</p>}</div>))}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {cv.skills && <div><h2 style={{ fontSize: '13px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px 0' }}>Technical Skills</h2>{cv.skills.split(',').map((s, i) => (<p key={i} style={{ fontSize: '11px', color: '#374151', margin: '3px 0' }}>▸ {s.trim()}</p>))}</div>}
        {cv.softSkills && <div><h2 style={{ fontSize: '13px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px 0' }}>Soft Skills</h2>{cv.softSkills.split(',').map((s, i) => (<p key={i} style={{ fontSize: '11px', color: '#374151', margin: '3px 0' }}>▸ {s.trim()}</p>))}</div>}
      </div>
      {cv.projects.some(p => p.name) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '13px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px 0' }}>Projects</h2>{cv.projects.filter(p => p.name).map((proj, i) => (<div key={i} style={{ marginBottom: '8px', paddingLeft: '12px', borderLeft: `2px solid ${headerColor}` }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{proj.name}</p>{proj.tech && <p style={{ fontSize: '11px', color: headerColor, margin: '2px 0', fontStyle: 'italic' }}>{proj.tech}</p>}{proj.description && <p style={{ fontSize: '11px', color: '#4b5563', margin: '2px 0', textAlign: 'justify' }}>{proj.description}</p>}</div>))}</div>}
      {cv.certifications?.some(c => c.name) && <div style={{ marginBottom: '16px' }}><h2 style={{ fontSize: '13px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px 0' }}>Certifications</h2>{cv.certifications.filter(c => c.name).map((cert, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><div><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{cert.name}</p><p style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', margin: '1px 0' }}>{cert.institution}</p></div><p style={{ fontSize: '11px', color: headerColor, margin: 0 }}>{cert.year}</p></div>))}</div>}
      {cv.references?.some(r => r.name) && <div><h2 style={{ fontSize: '13px', fontWeight: 'bold', color: headerColor, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px 0' }}>References</h2><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>{cv.references.filter(r => r.name).map((ref, i) => (<div key={i} style={{ padding: '8px', border: `1px solid #e5e7eb`, borderRadius: '6px' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{ref.name}</p><p style={{ fontSize: '11px', color: headerColor, fontStyle: 'italic', margin: '2px 0' }}>{ref.designation}</p><p style={{ fontSize: '11px', color: '#6b7280', margin: '1px 0' }}>{ref.organization}</p><p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{ref.contact}</p></div>))}</div></div>}
    </div>
  );
}

// ─── CV Document Router ─────────────────────────────────────────────────────
function CVDocument({ cv, headerColor, template }) {
  if (template === 'modern') return <ModernTemplate cv={cv} headerColor={headerColor} />;
  if (template === 'minimal') return <MinimalTemplate cv={cv} headerColor={headerColor} />;
  return <ClassicTemplate cv={cv} headerColor={headerColor} />;
}

// ─── Progress Bar ───────────────────────────────────────────────────────────
function ProgressBar({ cv }) {
  const fields = [
    { label: 'Name', done: !!cv.name },
    { label: 'Email', done: !!cv.email },
    { label: 'Phone', done: !!cv.phone },
    { label: 'Address', done: !!cv.address },
    { label: 'Objective', done: !!cv.objective },
    { label: 'Education', done: cv.education.some(e => e.degree) },
    { label: 'Experience', done: cv.experience.some(e => e.title) },
    { label: 'Skills', done: !!cv.skills },
    { label: 'Soft Skills', done: !!cv.softSkills },
    { label: 'Projects', done: cv.projects.some(p => p.name) },
    { label: 'Certifications', done: cv.certifications?.some(c => c.name) },
    { label: 'References', done: cv.references?.some(r => r.name) },
  ];
  const done = fields.filter(f => f.done).length;
  const pct = Math.round((done / fields.length) * 100);
  const color = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#10b981';
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-800">📊 CV Completion</h3>
        <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #1e3a8a, ${color})` }}></div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {fields.map((f, i) => (
          <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.done ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
            {f.done ? '✓' : '○'} {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Fullscreen Modal ───────────────────────────────────────────────────────
function FullscreenModal({ cv, headerColor, template, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto py-8"
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="relative">
        <button onClick={onClose}
          className="fixed top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 shadow-lg z-50 font-bold text-lg">
          ✕
        </button>
        <div style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <CVDocument cv={cv} headerColor={headerColor} template={template} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CVBuilder() {
  const [activeTab, setActiveTab] = useState('builder');
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingCV, setLoadingCV] = useState(true);
  const [headerColor, setHeaderColor] = useState('#1e3a8a');
  const [template, setTemplate] = useState('classic');
  const [versions, setVersions] = useState([]);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const pdfRef = useRef();
  const token = localStorage.getItem('token');
  const [cv, setCv] = useState(emptyCV);

  useEffect(() => {
    const loadCV = async () => {
      try {
        const res = await fetch(CV_API, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data) {
          setCv({
            name: data.name || '', email: data.email || '', phone: data.phone || '',
            address: data.address || '', linkedin: data.linkedin || '',
            objective: data.objective || '', photo: data.photo || '',
            education: data.education?.length ? data.education : [{ degree: '', institution: '', year: '', gpa: '' }],
            experience: data.experience?.length ? data.experience : [{ title: '', company: '', duration: '', description: '' }],
            skills: data.skills || '', softSkills: data.softSkills || '',
            projects: data.projects?.length ? data.projects : [{ name: '', description: '', tech: '' }],
            certifications: data.certifications?.length ? data.certifications : [{ name: '', institution: '', year: '' }],
            references: data.references?.length ? data.references : [{ name: '', designation: '', organization: '', contact: '' }],
          });
          setVersions(data.versions || []);
        }
      } catch (err) { console.error('Failed to load CV'); }
      finally { setLoadingCV(false); }
    };
    loadCV();
  }, []);

  const updateField = (f, v) => setCv(p => ({ ...p, [f]: v }));
  const addEducation = () => setCv(p => ({ ...p, education: [...p.education, { degree: '', institution: '', year: '', gpa: '' }] }));
  const addExperience = () => setCv(p => ({ ...p, experience: [...p.experience, { title: '', company: '', duration: '', description: '' }] }));
  const addProject = () => setCv(p => ({ ...p, projects: [...p.projects, { name: '', description: '', tech: '' }] }));
  const addCertification = () => setCv(p => ({ ...p, certifications: [...p.certifications, { name: '', institution: '', year: '' }] }));
  const addReference = () => setCv(p => ({ ...p, references: [...p.references, { name: '', designation: '', organization: '', contact: '' }] }));
  const updateEducation = (i, f, v) => { const u = [...cv.education]; u[i][f] = v; setCv(p => ({ ...p, education: u })); };
  const updateExperience = (i, f, v) => { const u = [...cv.experience]; u[i][f] = v; setCv(p => ({ ...p, experience: u })); };
  const updateProject = (i, f, v) => { const u = [...cv.projects]; u[i][f] = v; setCv(p => ({ ...p, projects: u })); };
  const updateCertification = (i, f, v) => { const u = [...cv.certifications]; u[i][f] = v; setCv(p => ({ ...p, certifications: u })); };
  const updateReference = (i, f, v) => { const u = [...cv.references]; u[i][f] = v; setCv(p => ({ ...p, references: u })); };

  const loadVersion = (version) => {
    setCv({
      name: version.data.name || '', email: version.data.email || '', phone: version.data.phone || '',
      address: version.data.address || '', linkedin: version.data.linkedin || '',
      objective: version.data.objective || '', photo: version.data.photo || '',
      education: version.data.education?.length ? version.data.education : [{ degree: '', institution: '', year: '', gpa: '' }],
      experience: version.data.experience?.length ? version.data.experience : [{ title: '', company: '', duration: '', description: '' }],
      skills: version.data.skills || '', softSkills: version.data.softSkills || '',
      projects: version.data.projects?.length ? version.data.projects : [{ name: '', description: '', tech: '' }],
      certifications: version.data.certifications?.length ? version.data.certifications : [{ name: '', institution: '', year: '' }],
      references: version.data.references?.length ? version.data.references : [{ name: '', designation: '', organization: '', contact: '' }],
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Photo must be under 2MB!'); return; }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 200; canvas.height = 200;
      ctx.drawImage(img, 0, 0, 200, 200);
      updateField('photo', canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = URL.createObjectURL(file);
  };

  const checkATS = () => {
    if (!jobDescription.trim()) return;
    const jdWords = jobDescription.toLowerCase().replace(/[^a-z0-9\s+#.]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const cvText = [
      cv.name, cv.objective, cv.skills, cv.softSkills,
      ...cv.education.map(e => `${e.degree} ${e.institution}`),
      ...cv.experience.map(e => `${e.title} ${e.company} ${e.description}`),
      ...cv.projects.map(p => `${p.name} ${p.tech} ${p.description}`),
      ...cv.certifications.map(c => `${c.name} ${c.institution}`),
    ].join(' ').toLowerCase();

    const stopWords = new Set(['the','and','for','are','was','with','this','that','have','from','they','will','your','been','has','but','not','you','all','can','her','him','his','its','may','our','out','per','put','say','she','use','who','why','yet']);
    const uniqueJDWords = [...new Set(jdWords)].filter(w => !stopWords.has(w));
    const matched = uniqueJDWords.filter(w => cvText.includes(w));
    const missing = uniqueJDWords.filter(w => !cvText.includes(w)).slice(0, 15);
    const score = Math.min(100, Math.round((matched.length / Math.max(uniqueJDWords.length, 1)) * 100));
    const techKeywords = matched.filter(w =>
      ['react','node','python','java','javascript','sql','mongodb','express','html','css',
       'typescript','angular','vue','aws','docker','git','api','rest','agile','scrum',
       'figma','flutter','kotlin','swift','php','laravel','django','spring'].includes(w)
    );
    setAtsResult({ score, matched: matched.length, total: uniqueJDWords.length, missing, techKeywords });
  };

  const saveCV = async () => {
    setSaving(true);
    try {
      const res = await fetch(CV_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(cv)
      });
      if (res.ok) {
        const data = await res.json();
        setVersions(data.cv.versions || []);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) { console.error('Failed to save CV'); }
    finally { setSaving(false); }
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const element = pdfRef.current;
      element.style.display = 'block';
      await new Promise(resolve => setTimeout(resolve, 150));
      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff', logging: false, foreignObjectRendering: false,
      });
      element.style.display = 'none';
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      if (pdfHeight > pageHeight) {
        let yOffset = 0, remaining = pdfHeight;
        while (remaining > 0) {
          pdf.addImage(imgData, 'JPEG', 0, -yOffset, pdfWidth, pdfHeight);
          remaining -= pageHeight; yOffset += pageHeight;
          if (remaining > 0) pdf.addPage();
        }
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      pdf.save(`${cv.name.replace(/\s+/g, '_') || 'My'}_CV.pdf`);
      try { await fetch('http://localhost:5001/api/cv/track-download', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch (e) {}
      setCv(emptyCV);
    } catch (err) {
      if (pdfRef.current) pdfRef.current.style.display = 'none';
      alert('PDF failed: ' + err.message);
    } finally { setDownloading(false); }
  };

  const tips = [
    { icon: '📝', title: 'Keep it concise', desc: 'Limit your CV to 1-2 pages.' },
    { icon: '🎯', title: 'Tailor for each job', desc: 'Use keywords from the job description.' },
    { icon: '📊', title: 'Quantify achievements', desc: 'Use numbers to show impact.' },
    { icon: '✅', title: 'Proofread carefully', desc: 'Always proofread multiple times.' },
    { icon: '🔗', title: 'Add LinkedIn', desc: 'Keep your LinkedIn up to date.' },
    { icon: '💼', title: 'List relevant skills', desc: 'Include both technical and soft skills.' },
  ];

  const templateOptions = [
    { id: 'classic', name: '🔵 Classic Blue', desc: 'Traditional header with contact info' },
    { id: 'modern', name: '🟠 Modern Sidebar', desc: 'Two-column with sidebar layout' },
    { id: 'minimal', name: '⚪ Minimal Clean', desc: 'Elegant serif with border accents' },
  ];

  const demoCV = {
    name: 'John Smith', email: 'john@email.com', phone: '+94 77 123 4567',
    address: 'Colombo, Sri Lanka', linkedin: 'linkedin.com/in/john',
    objective: 'Passionate software engineer seeking internship opportunities.',
    education: [{ degree: 'BSc Software Engineering', institution: 'SLIIT', year: '2021-2025', gpa: '3.8' }],
    experience: [{ title: 'Intern Developer', company: 'Tech Corp', duration: 'Jun-Aug 2024', description: 'Built web applications.' }],
    skills: 'React, Node.js, Python', softSkills: 'Leadership, Communication',
    projects: [{ name: 'InternHub', tech: 'MERN Stack', description: 'Internship management system.' }],
    certifications: [{ name: 'AWS Cloud', institution: 'Amazon', year: '2024' }],
    references: [{ name: 'Dr. Silva', designation: 'Lecturer', organization: 'SLIIT', contact: 'silva@sliit.lk' }],
    photo: '',
  };

  if (loadingCV) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center"><div className="text-4xl mb-4">📄</div><p className="text-gray-500">Loading your CV...</p></div>
    </div>
  );

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-8">

      {/* Hidden PDF */}
      <div ref={pdfRef} style={{ display: 'none', position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
        <CVDocument cv={cv} headerColor={headerColor} template={template} />
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <FullscreenModal cv={cv} headerColor={headerColor} template={template} onClose={() => setShowFullscreen(false)} />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📄 CV Builder</h1>
          <p className="text-gray-500 mt-1">Build your professional CV and download as PDF</p>
        </div>
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm">✅ CV saved!</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit">
        {[
          { id: 'builder', label: '🛠️ CV Builder' },
          { id: 'ats', label: '🎯 ATS Checker' },
          { id: 'tips', label: '💡 CV Tips' },
          { id: 'templates', label: '📋 Templates' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-800 to-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── BUILDER TAB ── */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* FORM */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">👤 Personal Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  {cv.photo ? (
                    <img src={cv.photo} alt="profile" className="w-16 h-16 rounded-full object-cover border-2 border-blue-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-800 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                      {cv.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Profile Photo <span className="text-gray-400 font-normal">(optional)</span></p>
                    <div className="flex gap-2">
                      <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium cursor-pointer transition-all">
                        📷 Upload
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      {cv.photo && (
                        <button onClick={() => updateField('photo', '')}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-all">
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <input type="text" placeholder="Full Name *" value={cv.name} onChange={e => updateField('name', e.target.value)} className={inputCls.replace('py-2.5', 'py-3')} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="email" placeholder="Email *" value={cv.email} onChange={e => updateField('email', e.target.value)} className={inputCls.replace('py-2.5', 'py-3')} />
                  <input type="text" placeholder="Phone *" value={cv.phone} onChange={e => updateField('phone', e.target.value)} className={inputCls.replace('py-2.5', 'py-3')} />
                </div>
                <input type="text" placeholder="Address" value={cv.address} onChange={e => updateField('address', e.target.value)} className={inputCls.replace('py-2.5', 'py-3')} />
                <input type="text" placeholder="LinkedIn URL" value={cv.linkedin} onChange={e => updateField('linkedin', e.target.value)} className={inputCls.replace('py-2.5', 'py-3')} />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🎯 Career Objective</h2>
              <textarea placeholder="Write a brief career objective..." value={cv.objective} onChange={e => updateField('objective', e.target.value)} rows={3} className={`${inputCls.replace('py-2.5', 'py-3')} resize-none`} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">🎓 Education</h2>
                <button onClick={addEducation} className="text-blue-600 text-sm font-medium hover:text-blue-700">+ Add</button>
              </div>
              {cv.education.map((edu, i) => (
                <div key={i} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
                  <input type="text" placeholder="Degree / Course" value={edu.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} className={inputCls} />
                  <input type="text" placeholder="Institution / University" value={edu.institution} onChange={e => updateEducation(i, 'institution', e.target.value)} className={inputCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Year (e.g. 2021-2025)" value={edu.year} onChange={e => updateEducation(i, 'year', e.target.value)} className={inputCls} />
                    <input type="text" placeholder="GPA / Grade" value={edu.gpa} onChange={e => updateEducation(i, 'gpa', e.target.value)} className={inputCls} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">💼 Experience</h2>
                <button onClick={addExperience} className="text-blue-600 text-sm font-medium hover:text-blue-700">+ Add</button>
              </div>
              {cv.experience.map((exp, i) => (
                <div key={i} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Job Title" value={exp.title} onChange={e => updateExperience(i, 'title', e.target.value)} className={inputCls} />
                    <input type="text" placeholder="Company" value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} className={inputCls} />
                  </div>
                  <input type="text" placeholder="Duration (e.g. Jan 2024 - Mar 2024)" value={exp.duration} onChange={e => updateExperience(i, 'duration', e.target.value)} className={inputCls} />
                  <textarea placeholder="Describe your responsibilities..." value={exp.description} onChange={e => updateExperience(i, 'description', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">⚡ Technical Skills</h2>
              <input type="text" placeholder="e.g. React, Node.js, Python (comma separated)" value={cv.skills} onChange={e => updateField('skills', e.target.value)} className={inputCls.replace('py-2.5', 'py-3')} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🤝 Soft Skills</h2>
              <input type="text" placeholder="e.g. Leadership, Communication (comma separated)" value={cv.softSkills} onChange={e => updateField('softSkills', e.target.value)} className={inputCls.replace('py-2.5', 'py-3')} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">🚀 Projects</h2>
                <button onClick={addProject} className="text-blue-600 text-sm font-medium hover:text-blue-700">+ Add</button>
              </div>
              {cv.projects.map((proj, i) => (
                <div key={i} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
                  <input type="text" placeholder="Project Name" value={proj.name} onChange={e => updateProject(i, 'name', e.target.value)} className={inputCls} />
                  <input type="text" placeholder="Technologies Used" value={proj.tech} onChange={e => updateProject(i, 'tech', e.target.value)} className={inputCls} />
                  <textarea placeholder="Brief description..." value={proj.description} onChange={e => updateProject(i, 'description', e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">🏆 Courses & Certifications</h2>
                <button onClick={addCertification} className="text-blue-600 text-sm font-medium hover:text-blue-700">+ Add</button>
              </div>
              {cv.certifications.map((cert, i) => (
                <div key={i} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
                  <input type="text" placeholder="Course / Certification Name" value={cert.name} onChange={e => updateCertification(i, 'name', e.target.value)} className={inputCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Institution / Platform" value={cert.institution} onChange={e => updateCertification(i, 'institution', e.target.value)} className={inputCls} />
                    <input type="text" placeholder="Year Completed" value={cert.year} onChange={e => updateCertification(i, 'year', e.target.value)} className={inputCls} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">👔 References</h2>
                <button onClick={addReference} className="text-blue-600 text-sm font-medium hover:text-blue-700">+ Add</button>
              </div>
              {cv.references.map((ref, i) => (
                <div key={i} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Full Name" value={ref.name} onChange={e => updateReference(i, 'name', e.target.value)} className={inputCls} />
                    <input type="text" placeholder="Designation" value={ref.designation} onChange={e => updateReference(i, 'designation', e.target.value)} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Organization" value={ref.organization} onChange={e => updateReference(i, 'organization', e.target.value)} className={inputCls} />
                    <input type="text" placeholder="Phone / Email" value={ref.contact} onChange={e => updateReference(i, 'contact', e.target.value)} className={inputCls} />
                  </div>
                </div>
              ))}
            </div>

            {/* Color + Template Picker */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">🎨 Customize</h3>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-gray-600 font-medium">Header Color:</span>
                <input type="color" value={headerColor} onChange={e => setHeaderColor(e.target.value)}
                  style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer', padding: '2px' }} />
                <span className="text-xs text-gray-400">Pick your header color</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {templateOptions.map(t => (
                  <button key={t.id} onClick={() => setTemplate(t.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${template === t.id ? 'border-blue-800 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="text-xs font-bold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={saveCV} disabled={saving || !cv.name}
              className="w-full py-3 bg-white border-2 border-blue-800 text-blue-800 hover:bg-blue-50 font-bold rounded-2xl transition-all disabled:opacity-50">
              {saving ? '⏳ Saving...' : '💾 Save CV'}
            </button>
            <button onClick={downloadPDF} disabled={downloading || !cv.name}
              className="w-full py-4 bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg disabled:opacity-50 text-lg">
              {downloading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating PDF...
                </span>
              ) : '⬇️ Download & Clear CV'}
            </button>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <ProgressBar cv={cv} />

            {/* A4 Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">👁️ Live Preview ({template})</p>
                <button onClick={() => setShowFullscreen(true)}
                  className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-all">
                  ⛶ Fullscreen
                </button>
              </div>
              <div style={{ overflow: 'hidden', height: '380px', position: 'relative' }}>
                <div style={{ transform: 'scale(0.42)', transformOrigin: 'top left', width: '238%' }}>
                  <CVDocument cv={cv} headerColor={headerColor} template={template} />
                </div>
              </div>
            </div>

            {/* CV Versions */}
            {versions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3">📁 Saved Versions</h3>
                <div className="space-y-2">
                  {[...versions].reverse().map((v, i) => (
                    <button key={i} onClick={() => loadVersion(v)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all text-left">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">v{v.versionNumber} — {v.data.name || 'Unnamed'}</p>
                        <p className="text-xs text-gray-400">{new Date(v.savedAt).toLocaleDateString()} {new Date(v.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="text-blue-600 text-xs font-medium">Load →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CV Tips */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">💡 CV Tips</h3>
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-gray-50 rounded-xl">
                    <span className="text-lg shrink-0">{tip.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{tip.title}</p>
                      <p className="text-xs text-gray-500">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ATS CHECKER TAB ── */}
      {activeTab === 'ats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">🎯 ATS Score Checker</h2>
              <p className="text-gray-500 text-sm mb-4">Paste a job description below to see how well your CV matches the requirements.</p>
              <textarea
                value={jobDescription}
                onChange={e => { setJobDescription(e.target.value); setAtsResult(null); }}
                placeholder={`Paste the job description here...\n\nExample:\nWe are looking for a React Developer with experience in Node.js, MongoDB, and REST APIs. The candidate should have strong communication skills and experience with Agile methodology...`}
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button onClick={checkATS} disabled={!jobDescription.trim() || !cv.name}
                className="mt-3 w-full py-3 bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg">
                🔍 Analyze CV Match
              </button>
              {!cv.name && <p className="text-orange-600 text-xs mt-2 text-center">⚠️ Please fill in your CV details first!</p>}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-blue-800 mb-3">💡 ATS Tips</h3>
              <ul className="space-y-2 text-xs text-blue-700">
                <li>✦ Use exact keywords from the job description</li>
                <li>✦ Spell out abbreviations (e.g. "Artificial Intelligence" not just "AI")</li>
                <li>✦ Include both technical and soft skills mentioned in JD</li>
                <li>✦ Aim for 70%+ match score for best results</li>
                <li>✦ Tailor your CV for each job application</li>
              </ul>
            </div>
          </div>

          <div>
            {!atsResult ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center h-full flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Ready to Analyze</h3>
                <p className="text-gray-500 text-sm">Paste a job description and click "Analyze CV Match" to see your ATS score!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                  <p className="text-gray-500 text-sm mb-3">Your ATS Match Score</p>
                  <div className="relative w-36 h-36 mx-auto mb-4">
                    <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle cx="60" cy="60" r="50" fill="none"
                        stroke={atsResult.score >= 70 ? '#10b981' : atsResult.score >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="10"
                        strokeDasharray={`${(atsResult.score / 100) * 314} 314`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-800">{atsResult.score}%</span>
                      <span className="text-xs text-gray-500">Match</span>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${atsResult.score >= 70 ? 'bg-green-100 text-green-700' : atsResult.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {atsResult.score >= 70 ? '🌟 Excellent Match!' : atsResult.score >= 50 ? '👍 Good Match' : '⚠️ Needs Improvement'}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="text-2xl font-bold text-green-700">{atsResult.matched}</div>
                      <div className="text-green-600 text-xs mt-1">Keywords Matched</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3">
                      <div className="text-2xl font-bold text-red-600">{atsResult.total - atsResult.matched}</div>
                      <div className="text-red-500 text-xs mt-1">Keywords Missing</div>
                    </div>
                  </div>
                </div>

                {atsResult.techKeywords.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">✅ Technical Keywords Found</h3>
                    <div className="flex flex-wrap gap-2">
                      {atsResult.techKeywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">✓ {kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {atsResult.missing.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">❌ Missing Keywords <span className="text-gray-400 font-normal">(add these to your CV)</span></h3>
                    <div className="flex flex-wrap gap-2">
                      {atsResult.missing.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium border border-red-200">✕ {kw}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">💡 Go to CV Builder and add these keywords to your skills or experience sections!</p>
                  </div>
                )}

                <button onClick={() => setActiveTab('builder')}
                  className="w-full py-3 bg-gradient-to-r from-blue-800 to-orange-600 text-white rounded-xl font-bold transition-all shadow-lg">
                  ✏️ Go Back & Improve CV →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TIPS TAB ── */}
      {activeTab === 'tips' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="text-4xl mb-3">{tip.icon}</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{tip.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{tip.desc}</p>
            </div>
          ))}
          <div className="md:col-span-2 lg:col-span-3 rounded-2xl p-6 text-white"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #ea580c 100%)' }}>
            <h3 className="text-xl font-bold mb-2">🌟 Pro Tip for SLIIT Students</h3>
            <p className="text-blue-100">Use InternHub's CV Builder to create a professional PDF CV in minutes!</p>
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {activeTab === 'templates' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {templateOptions.map((t) => (
              <div key={t.id}
                onClick={() => { setTemplate(t.id); setActiveTab('builder'); }}
                className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${template === t.id ? 'border-blue-800' : 'border-gray-100'}`}>
                <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left', width: '333%', pointerEvents: 'none' }}>
                    <CVDocument cv={demoCV} headerColor={headerColor} template={t.id} />
                  </div>
                  {template === t.id && (
                    <div className="absolute top-2 right-2 bg-blue-800 text-white text-xs px-2 py-1 rounded-lg font-bold">✓ Active</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800">{t.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{t.desc}</p>
                  <button onClick={() => { setTemplate(t.id); setActiveTab('builder'); }}
                    className={`mt-3 w-full py-2 rounded-xl text-sm font-medium transition-all ${template === t.id ? 'bg-blue-800 text-white' : 'bg-gradient-to-r from-blue-800 to-orange-600 text-white hover:shadow-lg'}`}>
                    {template === t.id ? '✓ Currently Selected' : 'Use This Template →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-blue-700 font-medium">💡 Click any template to preview and use it!</p>
          </div>
        </div>
      )}
    </div>
  );
}