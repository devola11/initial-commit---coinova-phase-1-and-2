import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra',
  'Angola', 'Antigua and Barbuda', 'Argentina',
  'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
  'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
  'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon',
  'Canada', 'Central African Republic', 'Chad',
  'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
  'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
  'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa',
  'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
]

const DOC_TYPES = [
  { id: 'national_id', label: 'National ID Card', icon: 'M15 9h-6v6h6V9zm-1 5h-4v-4h4v4zm7-11H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z' },
  { id: 'passport', label: 'International Passport', icon: 'M6 2C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H6zm6 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm5 10H7v-1c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5v1z' },
  { id: 'drivers_license', label: "Driver's License", icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6h16v3H4V6zm0 14v-9h16v9H4zm2-7h4v2H6v-2zm0 3h8v2H6v-2z' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1
        const completed = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                completed
                  ? 'bg-[#05B169] text-white'
                  : active
                  ? 'bg-[#0052FF] text-white'
                  : 'bg-[#1E2025] text-[#8A8F98]'
              }`}
            >
              {completed ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : step}
            </div>
            {i < total - 1 && (
              <div className={`w-8 h-0.5 ${completed ? 'bg-[#05B169]' : 'bg-[#1E2025]'}`} />
            )}
          </div>
        )
      })}
      <span className="text-[#8A8F98] text-xs ml-2">Step {current} of {total}</span>
    </div>
  )
}

function FileUploadZone({ label, file, onFileSelect, uploading, progress }) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    if (file.type === 'application/pdf') { setPreview('pdf'); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) validateAndSet(f)
  }

  function handleSelect(e) {
    const f = e.target.files[0]
    if (f) validateAndSet(f)
  }

  function validateAndSet(f) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      alert('Only JPG, PNG, or PDF files are allowed')
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      alert('File must be under 5MB')
      return
    }
    onFileSelect(f)
  }

  return (
    <div className="flex-1">
      <div className="text-[#8A8F98] text-xs font-medium mb-2">{label}</div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          file
            ? 'border-[#05B169] bg-[#05B169]/5'
            : dragOver
            ? 'border-[#0052FF] bg-[#0052FF]/5'
            : 'border-[#2C2F36] hover:border-[#0052FF]'
        }`}
        onClick={() => document.getElementById(`file-${label}`).click()}
      >
        <input
          id={`file-${label}`}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleSelect}
          className="hidden"
        />
        {preview && preview !== 'pdf' ? (
          <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg mx-auto mb-2" />
        ) : preview === 'pdf' ? (
          <div className="w-20 h-20 rounded-lg bg-[#1E2025] flex items-center justify-center mx-auto mb-2">
            <span className="text-[#8A8F98] text-xs font-bold">PDF</span>
          </div>
        ) : (
          <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8A8F98" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        )}
        <div className="text-[#8A8F98] text-xs">
          {file ? file.name : 'Click to upload or drag and drop'}
        </div>
        <div className="text-[#5E6168] text-[10px] mt-1">JPG, PNG, PDF up to 5MB</div>
        {uploading && (
          <div className="mt-3">
            <div className="w-full bg-[#1E2025] rounded-full h-1.5">
              <div className="bg-[#0052FF] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KYC() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Step 1 - Personal info
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [step1Error, setStep1Error] = useState('')
  const [countrySearch, setCountrySearch] = useState('')

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES
    const q = countrySearch.toLowerCase()
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q))
  }, [countrySearch])

  // Step 2 - Document
  const [docType, setDocType] = useState('')
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [frontUrl, setFrontUrl] = useState('')
  const [backUrl, setBackUrl] = useState('')

  // Step 3 - Selfie
  const [selfieFile, setSelfieFile] = useState(null)
  const [selfieUrl, setSelfieUrl] = useState('')

  // Step 4 - Confirm
  const [confirmed, setConfirmed] = useState(false)

  // Check existing KYC
  useEffect(() => {
    if (!user) return
    supabase
      .from('kyc_submissions')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]?.status === 'pending' || data?.[0]?.status === 'approved') {
          navigate('/settings')
        }
      })
  }, [user, navigate])

  async function uploadFile(file, path) {
    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { cacheControl: '3600', upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(path)
    return urlData.publicUrl
  }

  function validateStep1() {
    if (!fullName.trim() || !dob || !country || !phone.trim() || !address.trim()) {
      setStep1Error('All fields are required')
      return false
    }
    setStep1Error('')
    return true
  }

  async function handleUploadDocuments() {
    if (!frontFile || !backFile) return
    setUploading(true)
    setUploadProgress(20)
    try {
      const ts = Date.now()
      const frontExt = frontFile.name.split('.').pop()
      const backExt = backFile.name.split('.').pop()
      const frontPath = `${user.id}/front_${ts}.${frontExt}`
      const backPath = `${user.id}/back_${ts}.${backExt}`

      setUploadProgress(40)
      const fUrl = await uploadFile(frontFile, frontPath)
      setUploadProgress(70)
      const bUrl = await uploadFile(backFile, backPath)
      setUploadProgress(100)

      setFrontUrl(fUrl)
      setBackUrl(bUrl)
      setStep(3)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleUploadSelfie() {
    if (!selfieFile) {
      setStep(4)
      return
    }
    setUploading(true)
    try {
      const ts = Date.now()
      const ext = selfieFile.name.split('.').pop()
      const path = `${user.id}/selfie_${ts}.${ext}`
      const url = await uploadFile(selfieFile, path)
      setSelfieUrl(url)
      setStep(4)
    } catch (err) {
      console.error('Selfie upload failed:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!confirmed) return
    setSubmitting(true)
    try {
      const { error: insErr } = await supabase.from('kyc_submissions').insert({
        user_id: user.id,
        full_name: fullName,
        date_of_birth: dob,
        country,
        phone,
        address,
        document_type: docType,
        front_image_url: frontUrl,
        back_image_url: backUrl,
        selfie_url: selfieUrl || null,
        status: 'pending',
      })
      if (insErr) throw insErr

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', user.id)
      if (profErr) throw profErr

      setSubmitted(true)
    } catch (err) {
      console.error('KYC submission failed:', err)
      alert('Submission failed: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="mb-6">
          <svg className="mx-auto" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="#0052FF" strokeWidth="3" fill="#0052FF10"/>
            <circle cx="40" cy="40" r="8" fill="#0052FF"/>
            <line x1="40" y1="24" x2="40" y2="40" stroke="#0052FF" strokeWidth="3" strokeLinecap="round"/>
            <line x1="40" y1="40" x2="52" y2="46" stroke="#0052FF" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="40" cy="56" r="2" fill="#0052FF"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Verification submitted!</h1>
        <p className="text-[#8A8F98] text-sm mb-2">
          We will review your documents within 24-48 hours.
        </p>
        <p className="text-[#8A8F98] text-sm mb-8">
          You will receive an email when approved.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-8 py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white font-semibold text-sm border-none cursor-pointer transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* STEP 1 - Personal Information */}
      {step === 1 && (
        <>
          <StepIndicator current={1} total={4} />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Verify your identity</h1>
          <p className="text-[#8A8F98] text-sm mb-6">Required to unlock investment features</p>

          <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6 space-y-4">
            {step1Error && (
              <div className="bg-[#F6465D]/10 border border-[#F6465D]/20 text-[#F6465D] text-sm rounded-lg px-4 py-3">
                {step1Error}
              </div>
            )}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#8A8F98] mb-2 font-medium">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-4 py-3 text-sm text-white placeholder-[#5E6168] focus:outline-none focus:border-[#0052FF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#8A8F98] mb-2 font-medium">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0052FF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#8A8F98] mb-2 font-medium">Country of Residence</label>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => { setCountrySearch(e.target.value); if (country) setCountry('') }}
                placeholder="Search country..."
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-4 py-2 text-xs text-[#8A8F98] placeholder-[#5E6168] focus:outline-none focus:border-[#0052FF] transition-colors mb-1.5"
              />
              <select
                value={country}
                onChange={(e) => { setCountry(e.target.value); setCountrySearch('') }}
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0052FF] cursor-pointer transition-colors"
              >
                <option value="">Select country</option>
                {filteredCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#8A8F98] mb-2 font-medium">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-4 py-3 text-sm text-white placeholder-[#5E6168] focus:outline-none focus:border-[#0052FF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#8A8F98] mb-2 font-medium">Home Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full home address"
                rows={3}
                className="w-full bg-[#0A0B0D] border border-[#1E2025] rounded-lg px-4 py-3 text-sm text-white placeholder-[#5E6168] focus:outline-none focus:border-[#0052FF] transition-colors resize-none"
              />
            </div>
            <button
              onClick={() => validateStep1() && setStep(2)}
              className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white font-semibold text-sm border-none cursor-pointer transition-colors"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {/* STEP 2 - Document Upload */}
      {step === 2 && (
        <>
          <StepIndicator current={2} total={4} />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Upload your ID document</h1>
          <p className="text-[#8A8F98] text-sm mb-6">Select your document type and upload both sides</p>

          <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6">
            {/* Document type selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setDocType(dt.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-colors cursor-pointer ${
                    docType === dt.id
                      ? 'bg-[#0052FF]/10 border-[#0052FF]'
                      : 'bg-[#141519] border-[#1E2025] hover:border-[#2C2F36]'
                  }`}
                >
                  <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill={docType === dt.id ? '#0052FF' : '#8A8F98'}>
                    <path d={dt.icon} />
                  </svg>
                  <div className={`text-xs font-medium ${docType === dt.id ? 'text-[#0052FF]' : 'text-[#8A8F98]'}`}>
                    {dt.label}
                  </div>
                </button>
              ))}
            </div>

            {docType && (
              <>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <FileUploadZone
                    label="Front of document"
                    file={frontFile}
                    onFileSelect={setFrontFile}
                    uploading={uploading}
                    progress={uploadProgress}
                  />
                  <FileUploadZone
                    label="Back of document"
                    file={backFile}
                    onFileSelect={setBackFile}
                    uploading={uploading}
                    progress={uploadProgress}
                  />
                </div>
                <button
                  onClick={handleUploadDocuments}
                  disabled={!frontFile || !backFile || uploading}
                  className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Continue'}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setStep(1)}
            className="mt-4 text-[#8A8F98] hover:text-white text-sm bg-transparent border-none cursor-pointer transition-colors"
          >
            &larr; Back
          </button>
        </>
      )}

      {/* STEP 3 - Selfie */}
      {step === 3 && (
        <>
          <StepIndicator current={3} total={4} />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Take a selfie with your ID</h1>
          <p className="text-[#8A8F98] text-sm mb-6">Hold your ID next to your face and take a clear photo</p>

          <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6">
            <div className="max-w-sm mx-auto mb-6">
              <FileUploadZone
                label="Selfie with ID"
                file={selfieFile}
                onFileSelect={setSelfieFile}
                uploading={uploading}
                progress={0}
              />
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleUploadSelfie}
                disabled={uploading}
                className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Continue'}
              </button>
              <button
                onClick={() => { setSelfieFile(null); setSelfieUrl(''); setStep(4) }}
                className="text-[#8A8F98] hover:text-white text-sm bg-transparent border-none cursor-pointer transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="mt-4 text-[#8A8F98] hover:text-white text-sm bg-transparent border-none cursor-pointer transition-colors"
          >
            &larr; Back
          </button>
        </>
      )}

      {/* STEP 4 - Review & Submit */}
      {step === 4 && (
        <>
          <StepIndicator current={4} total={4} />
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Review and submit</h1>
          <p className="text-[#8A8F98] text-sm mb-6">Please verify all information is correct before submitting</p>

          <div className="bg-[#141519] border border-[#1E2025] rounded-xl p-6 space-y-5">
            {/* Personal info summary */}
            <div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-[#8A8F98] font-medium mb-3">Personal Information</div>
              <div className="bg-[#0A0B0D] border border-[#1E2025] rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#8A8F98]">Name</span><span className="text-white">{fullName}</span></div>
                <div className="flex justify-between"><span className="text-[#8A8F98]">Date of Birth</span><span className="text-white">{dob}</span></div>
                <div className="flex justify-between"><span className="text-[#8A8F98]">Country</span><span className="text-white">{country}</span></div>
                <div className="flex justify-between"><span className="text-[#8A8F98]">Phone</span><span className="text-white">{phone}</span></div>
                <div className="flex justify-between"><span className="text-[#8A8F98]">Address</span><span className="text-white text-right max-w-[60%]">{address}</span></div>
              </div>
            </div>

            {/* Document summary */}
            <div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-[#8A8F98] font-medium mb-3">Documents</div>
              <div className="bg-[#0A0B0D] border border-[#1E2025] rounded-lg p-4">
                <div className="flex justify-between mb-3">
                  <span className="text-[#8A8F98] text-sm">Document type</span>
                  <span className="text-white text-sm capitalize">{docType.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-3">
                  {frontUrl && (
                    <div className="flex-1">
                      <div className="text-[#8A8F98] text-xs mb-1">Front</div>
                      <img src={frontUrl} alt="Front" className="w-full h-20 object-cover rounded-lg bg-[#1E2025]" />
                    </div>
                  )}
                  {backUrl && (
                    <div className="flex-1">
                      <div className="text-[#8A8F98] text-xs mb-1">Back</div>
                      <img src={backUrl} alt="Back" className="w-full h-20 object-cover rounded-lg bg-[#1E2025]" />
                    </div>
                  )}
                  {selfieUrl && (
                    <div className="flex-1">
                      <div className="text-[#8A8F98] text-xs mb-1">Selfie</div>
                      <img src={selfieUrl} alt="Selfie" className="w-full h-20 object-cover rounded-lg bg-[#1E2025]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 cursor-pointer accent-[#0052FF]"
              />
              <span className="text-[#8A8F98] text-sm">
                I confirm that all the information provided is accurate and the documents are genuine.
              </span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={!confirmed || submitting}
              className="w-full py-3 rounded-lg bg-[#0052FF] hover:bg-[#0046D9] text-white font-semibold text-sm border-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : 'Submit for verification'}
            </button>
          </div>

          <button
            onClick={() => setStep(3)}
            className="mt-4 text-[#8A8F98] hover:text-white text-sm bg-transparent border-none cursor-pointer transition-colors"
          >
            &larr; Back
          </button>
        </>
      )}
    </div>
  )
}
