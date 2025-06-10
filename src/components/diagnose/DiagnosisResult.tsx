import React from 'react'
import { CheckCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react'

/**
 * Renders a detailed health analysis of a plant based on a diagnosis object.
 * @example
 * DiagnosisResult({ status: 'healthy', confidence: 0.85, disease: 'None', description: 'No issues detected', symptoms: [], recommendations: [], prevention: [] })
 * // Returns a React component displaying the plant health status, confidence score, and other details.
 * @param {Object} diagnosis - The diagnosis data containing various aspects of plant health.
 * @returns {JSX.Element} A React component summarizing the plant's health condition with visual icons and color coding.
 * @description
 *   - The function uses helper functions 'getStatusIcon' and 'getStatusColor' to dynamically select icons/colors based on the plant status.
 *   - The component conditionally renders different sections such as confidence score, disease detection, and recommendations depending on the provided diagnosis data.
 *   - The analysis includes a note highlighting the AI-generated nature of the diagnosis, advising consultation with a professional.
 */
const DiagnosisResult = ({ diagnosis }) => {
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return <CheckCircle size={24} color="#4CAF50" />
      case 'diseased':
        return <AlertTriangle size={24} color="#FF9800" />
      default:
        return <Info size={24} color="#2196F3" />
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return '#4CAF50'
      case 'diseased':
        return '#FF9800'
      default:
        return '#2196F3'
    }
  }

  return (
    <div className="diagnosis-result">
      <div className="diagnosis-title">
        {getStatusIcon(diagnosis.status)}
        Plant Health Analysis
      </div>

      <div className="diagnosis-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            color: getStatusColor(diagnosis.status), 
            margin: '0 0 0.5rem 0',
            fontSize: '1.3rem'
          }}>
            Status: {diagnosis.status || 'Unknown'}
          </h3>

          {diagnosis.confidence && (
            <div className="confidence-score">
              Confidence: {Math.round(diagnosis.confidence * 100)}%
            </div>
          )}
        </div>

        {diagnosis.disease && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#333', margin: '0 0 0.5rem 0' }}>
              Detected Condition:
            </h4>
            <p style={{ margin: '0', fontWeight: '600', color: '#FF9800' }}>
              {diagnosis.disease}
            </p>
          </div>
        )}

        {diagnosis.description && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#333', margin: '0 0 0.5rem 0' }}>
              Description:
            </h4>
            <p style={{ margin: '0', lineHeight: '1.6' }}>
              {diagnosis.description}
            </p>
          </div>
        )}

        {diagnosis.symptoms && diagnosis.symptoms.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#333', margin: '0 0 0.5rem 0' }}>
              Observed Symptoms:
            </h4>
            <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
              {diagnosis.symptoms.map((symptom, index) => (
                <li key={index} style={{ marginBottom: '0.3rem' }}>
                  {symptom}
                </li>
              ))}
            </ul>
          </div>
        )}

        {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ 
              color: '#333', 
              margin: '0 0 0.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Lightbulb size={18} />
              Treatment Recommendations:
            </h4>
            <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
              {diagnosis.recommendations.map((recommendation, index) => (
                <li key={index} style={{ 
                  marginBottom: '0.5rem',
                  lineHeight: '1.5'
                }}>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {diagnosis.prevention && diagnosis.prevention.length > 0 && (
          <div>
            <h4 style={{ color: '#333', margin: '0 0 0.5rem 0' }}>
              Prevention Tips:
            </h4>
            <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
              {diagnosis.prevention.map((tip, index) => (
                <li key={index} style={{ 
                  marginBottom: '0.3rem',
                  color: '#666'
                }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <strong>Note:</strong> This analysis is AI-generated and should be used as a reference. 
        For serious plant health issues, consult with a professional plant pathologist or local agricultural extension service.
      </div>
    </div>
  )
}

export default DiagnosisResult
