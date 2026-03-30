import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeApi } from '../api/analyzeApi'
import { Upload, FileText, Image, X, AlertCircle, CheckCircle, Stethoscope, Sparkles, User, Heart } from 'lucide-react'
import { Card, Button, TextArea, Input, LoadingSpinner, Alert } from '../components/common'
import toast from 'react-hot-toast'

export default function NewAnalysis() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const prescriptionInputRef = useRef(null)

  const [formData, setFormData] = useState({
    symptoms: '',
    age: '',
    gender: '',
    medicalHistory: '',
  })
  const [images, setImages] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [triagePreview, setTriagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkingTriage, setCheckingTriage] = useState(false)
  const [errors, setErrors] = useState({})
  const [triageError, setTriageError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setErrors({ ...errors, [name]: '' })
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`)
        return false
      }
      return true
    })
    if (images.length + validFiles.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }
    setImages([...images, ...validFiles])
  }

  const handlePrescriptionSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter((file) => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid file type`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`)
        return false
      }
      return true
    })
    if (prescriptions.length + validFiles.length > 3) {
      toast.error('Maximum 3 prescriptions allowed')
      return
    }
    setPrescriptions([...prescriptions, ...validFiles])
  }

  const removeImage = (index) => setImages(images.filter((_, i) => i !== index))
  const removePrescription = (index) => setPrescriptions(prescriptions.filter((_, i) => i !== index))

  const checkTriage = async () => {
    if (!formData.symptoms || formData.symptoms.length < 5) {
      setErrors({ ...errors, symptoms: 'Please describe your symptoms (at least 5 characters)' })
      return
    }
    setCheckingTriage(true)
    setTriageError(null)
    try {
      const response = await analyzeApi.preCheck(formData.symptoms)
      setTriagePreview(response.triage || response.data?.triage)
    } catch (err) {
      console.warn('Triage check failed:', err.message)
      setTriageError('Failed to check symptoms. Please try again.')
    } finally {
      setCheckingTriage(false)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.symptoms || formData.symptoms.length < 5) {
      newErrors.symptoms = 'Please describe your symptoms (at least 5 characters)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const data = new FormData()
      data.append('symptoms', formData.symptoms)
      if (formData.age) data.append('age', formData.age)
      if (formData.gender) data.append('gender', formData.gender)
      if (formData.medicalHistory) data.append('medicalHistory', formData.medicalHistory)

      images.forEach((img) => data.append('images', img))
      prescriptions.forEach((rx) => data.append('prescriptions', rx))

      const response = await analyzeApi.analyze(data)
      if (response.id) {
        toast.success('Analysis complete!')
        navigate(`/result/${response.id}`)
      } else {
        throw new Error('Invalid response')
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Analysis failed. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          New Health Analysis
        </h1>
        <p className="mt-2 text-gray-600">Describe your symptoms for AI-powered health insights</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Describe Your Symptoms</h2>
              <p className="text-xs text-gray-500">Include when they started, severity, and any relevant context</p>
            </div>
          </div>

          <TextArea
            name="symptoms"
            placeholder="e.g., I've been experiencing mild headaches for the past 3 days, especially in the morning. The pain is around my temples and feels like pressure..."
            rows={5}
            value={formData.symptoms}
            onChange={handleChange}
            error={errors.symptoms}
            className="pl-0 border-0 focus:ring-0 text-base"
          />

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={checkTriage}
              loading={checkingTriage}
              disabled={!formData.symptoms || formData.symptoms.length < 5}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Quick Emergency Check
            </Button>
            {formData.symptoms.length >= 5 && (
              <span className="text-xs text-gray-500">
                {formData.symptoms.length} characters
              </span>
            )}
          </div>

          {checkingTriage && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <LoadingSpinner size="sm" />
              Checking for emergency symptoms...
            </div>
          )}

          {triageError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {triageError}
            </div>
          )}

          {triagePreview && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                {triagePreview.isEmergency ? (
                  <>
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800">Emergency Symptoms Detected</p>
                      <p className="text-sm text-red-600 mt-1">{triagePreview.recommendation?.instruction}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">No Emergency Detected</p>
                      <p className="text-sm text-green-600 mt-1">{triagePreview.recommendation?.instruction}</p>
                    </div>
                  </>
                )}
              </div>
              {triagePreview.flags?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Possible causes:</p>
                  <div className="flex flex-wrap gap-2">
                    {triagePreview.flags.map((flag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                        {flag.message}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Patient Information</h2>
              <p className="text-xs text-gray-500">Optional details for more accurate analysis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
              <input
                type="number"
                name="age"
                placeholder="Enter age"
                min="0"
                max="150"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical History</label>
            <input
              type="text"
              name="medicalHistory"
              placeholder="e.g., diabetes, hypertension, allergies"
              value={formData.medicalHistory}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Upload Files</h2>
              <p className="text-xs text-gray-500">Add images or prescription documents</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Images
                <span className="text-xs text-gray-400">({images.length}/5)</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50/50 transition-all flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">Click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </button>
              {images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {images.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <Image className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                      <button type="button" onClick={() => removeImage(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prescriptions
                <span className="text-xs text-gray-400">({prescriptions.length}/3)</span>
              </label>
              <input
                type="file"
                ref={prescriptionInputRef}
                accept=".pdf,.doc,.docx"
                multiple
                onChange={handlePrescriptionSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => prescriptionInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50/50 transition-all flex flex-col items-center"
              >
                <FileText className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">Click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC up to 5MB</p>
              </button>
              {prescriptions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {prescriptions.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                      <button type="button" onClick={() => removePrescription(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {triagePreview?.isEmergency && (
          <Alert variant="emergency">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Emergency Symptoms Detected</p>
                <p className="text-sm opacity-90 mt-1">
                  We recommend seeking immediate medical attention. This analysis is for informational purposes only.
                </p>
              </div>
            </div>
          </Alert>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={loading} disabled={loading}>
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze Symptoms
          </Button>
        </div>
      </form>
    </div>
  )
}
