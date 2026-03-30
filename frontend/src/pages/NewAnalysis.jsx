import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeApi } from '../api/analyzeApi'
import { Upload, FileText, Image, X, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, Button, TextArea, Input, LoadingSpinner, Alert, ErrorState } from '../components/common'
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

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index))
  }

  const checkTriage = async () => {
    if (!formData.symptoms || formData.symptoms.length < 5) {
      setErrors({ ...errors, symptoms: 'Please describe your symptoms (at least 5 characters)' })
      return
    }

    setCheckingTriage(true)
    setTriageError(null)
    try {
      const response = await analyzeApi.preCheck(formData.symptoms)
      setTriagePreview(response.data.triage)
    } catch (error) {
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
      toast.success('Analysis complete!')
      navigate(`/result/${response.data.id}`)
    } catch (error) {
      const message = error.response?.data?.message || 'Analysis failed. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Health Analysis</h1>
        <p className="mt-2 text-gray-600">Describe your symptoms for AI-powered health insights</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptoms Description</h2>

          <TextArea
            name="symptoms"
            placeholder="Describe your symptoms in detail. Include when they started, severity, and any relevant context..."
            rows={6}
            value={formData.symptoms}
            onChange={handleChange}
            error={errors.symptoms}
          />

          <div className="mt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={checkTriage}
              loading={checkingTriage}
              disabled={!formData.symptoms || formData.symptoms.length < 5}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Check Emergency
            </Button>
          </div>

          {checkingTriage && <LoadingSpinner size="sm" />}

          {triageError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {triageError}
            </div>
          )}

          {triagePreview && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {triagePreview.isEmergency ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className="font-semibold">
                  {triagePreview.isEmergency ? 'Emergency Symptoms Detected' : 'No Emergency Detected'}
                </span>
              </div>
              {triagePreview.flags?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Detected flags:</p>
                  <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                    {triagePreview.flags.map((flag, i) => (
                      <li key={i}>{flag.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-2 text-sm text-gray-600">
                {triagePreview.recommendation?.instruction}
              </p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information (Optional)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              name="age"
              placeholder="Age"
              min="0"
              max="150"
              value={formData.age}
              onChange={handleChange}
            />

            <div>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Input
              type="text"
              name="medicalHistory"
              placeholder="Medical history (comma-separated, e.g., diabetes, hypertension)"
              value={formData.medicalHistory}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Images (Max 5)
              </p>
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
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload images</p>
              </button>
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
                      <span className="text-sm truncate max-w-[100px]">{file.name}</span>
                      <button type="button" onClick={() => removeImage(i)} className="text-gray-500 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prescriptions (Max 3)
              </p>
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
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload prescriptions</p>
              </button>
              {prescriptions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {prescriptions.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
                      <span className="text-sm truncate max-w-[100px]">{file.name}</span>
                      <button type="button" onClick={() => removePrescription(i)} className="text-gray-500 hover:text-red-500">
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
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Emergency Symptoms Detected</p>
                <p className="text-sm mt-1">
                  Based on your symptoms, we recommend seeking immediate medical attention.
                  This analysis is for informational purposes only and does not replace professional medical advice.
                </p>
              </div>
            </div>
          </Alert>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            Submit Analysis
          </Button>
        </div>
      </form>
    </div>
  )
}
