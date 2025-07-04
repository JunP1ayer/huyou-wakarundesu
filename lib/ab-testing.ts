// Privacy-first A/B testing framework
// Integrates with Google Analytics 4 for experiment tracking

import { trackEvent } from './analytics'

export interface ExperimentConfig {
  id: string
  name: string
  description: string
  variants: ExperimentVariant[]
  trafficAllocation: number // 0-1, percentage of users to include
  status: 'draft' | 'active' | 'paused' | 'completed'
  startDate?: Date
  endDate?: Date
}

export interface ExperimentVariant {
  id: string
  name: string
  weight: number // Relative weight for traffic split
  config: Record<string, any>
}

export interface UserExperiment {
  experimentId: string
  variantId: string
  assignedAt: Date
  exposed: boolean
}

class ABTestingManager {
  private experiments: Map<string, ExperimentConfig> = new Map()
  private userExperiments: Map<string, UserExperiment> = new Map()
  private userId: string | null = null

  constructor() {
    this.loadExperiments()
    this.loadUserExperiments()
  }

  // Initialize with user ID (should be anonymous/hashed)
  setUserId(userId: string) {
    this.userId = userId
    this.loadUserExperiments()
  }

  // Register an experiment
  registerExperiment(config: ExperimentConfig) {
    this.experiments.set(config.id, config)
    this.saveExperiments()
  }

  // Get variant for a user in an experiment
  getVariant(experimentId: string): ExperimentVariant | null {
    const experiment = this.experiments.get(experimentId)
    if (!experiment || experiment.status !== 'active') {
      return null
    }

    // Check if user is already assigned
    const userExperiment = this.userExperiments.get(experimentId)
    if (userExperiment) {
      const variant = experiment.variants.find(v => v.id === userExperiment.variantId)
      return variant || null
    }

    // Check traffic allocation
    if (Math.random() > experiment.trafficAllocation) {
      return null
    }

    // Assign variant based on weights
    const variant = this.assignVariant(experiment)
    if (variant) {
      this.assignUserToVariant(experimentId, variant.id)
      
      // Track assignment event
      trackEvent('experiment_assignment', {
        experiment_id: experimentId,
        variant_id: variant.id,
        assignment_method: 'weighted_random'
      })
    }

    return variant
  }

  // Check if user is in a specific variant
  isInVariant(experimentId: string, variantId: string): boolean {
    const variant = this.getVariant(experimentId)
    return variant?.id === variantId
  }

  // Get experiment configuration value
  getConfig<T>(experimentId: string, key: string, defaultValue: T): T {
    const variant = this.getVariant(experimentId)
    if (variant && key in variant.config) {
      return variant.config[key] as T
    }
    return defaultValue
  }

  // Track that user was exposed to experiment
  trackExposure(experimentId: string) {
    const userExperiment = this.userExperiments.get(experimentId)
    if (userExperiment && !userExperiment.exposed) {
      userExperiment.exposed = true
      this.saveUserExperiments()

      // Track exposure event
      trackEvent('experiment_exposure', {
        experiment_id: experimentId,
        variant_id: userExperiment.variantId
      })
    }
  }

  // Track conversion event
  trackConversion(experimentId: string, conversionType: string, value?: number) {
    const userExperiment = this.userExperiments.get(experimentId)
    if (userExperiment) {
      trackEvent('experiment_conversion', {
        experiment_id: experimentId,
        variant_id: userExperiment.variantId,
        conversion_type: conversionType,
        conversion_value: value
      })
    }
  }

  private assignVariant(experiment: ExperimentConfig): ExperimentVariant | null {
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0)
    if (totalWeight === 0) return null

    const random = Math.random() * totalWeight
    let currentWeight = 0

    for (const variant of experiment.variants) {
      currentWeight += variant.weight
      if (random <= currentWeight) {
        return variant
      }
    }

    return experiment.variants[0] // Fallback
  }

  private assignUserToVariant(experimentId: string, variantId: string) {
    const userExperiment: UserExperiment = {
      experimentId,
      variantId,
      assignedAt: new Date(),
      exposed: false
    }

    this.userExperiments.set(experimentId, userExperiment)
    this.saveUserExperiments()
  }

  private loadExperiments() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('ab_experiments')
      if (stored) {
        const experiments = JSON.parse(stored)
        this.experiments = new Map(Object.entries(experiments))
      }
    } catch (error) {
      console.error('Failed to load experiments:', error)
    }
  }

  private saveExperiments() {
    if (typeof window === 'undefined') return

    try {
      const experimentsObj = Object.fromEntries(this.experiments.entries())
      localStorage.setItem('ab_experiments', JSON.stringify(experimentsObj))
    } catch (error) {
      console.error('Failed to save experiments:', error)
    }
  }

  private loadUserExperiments() {
    if (typeof window === 'undefined' || !this.userId) return

    try {
      const stored = localStorage.getItem(`ab_user_experiments_${this.userId}`)
      if (stored) {
        const experiments = JSON.parse(stored)
        this.userExperiments = new Map(
          Object.entries(experiments).map(([key, value]: [string, any]) => [
            key,
            {
              ...value,
              assignedAt: new Date(value.assignedAt)
            }
          ])
        )
      }
    } catch (error) {
      console.error('Failed to load user experiments:', error)
    }
  }

  private saveUserExperiments() {
    if (typeof window === 'undefined' || !this.userId) return

    try {
      const experimentsObj = Object.fromEntries(this.userExperiments.entries())
      localStorage.setItem(`ab_user_experiments_${this.userId}`, JSON.stringify(experimentsObj))
    } catch (error) {
      console.error('Failed to save user experiments:', error)
    }
  }
}

// Global instance
export const abTesting = new ABTestingManager()

// React hook for A/B testing
export const useExperiment = (experimentId: string) => {
  const variant = abTesting.getVariant(experimentId)
  
  // Auto-track exposure when variant is accessed
  if (variant && typeof window !== 'undefined') {
    // Use setTimeout to avoid blocking render
    setTimeout(() => abTesting.trackExposure(experimentId), 0)
  }

  return {
    variant,
    isInVariant: (variantId: string) => abTesting.isInVariant(experimentId, variantId),
    getConfig: <T>(key: string, defaultValue: T) => abTesting.getConfig(experimentId, key, defaultValue),
    trackConversion: (conversionType: string, value?: number) => 
      abTesting.trackConversion(experimentId, conversionType, value)
  }
}

// Pre-defined experiments for the application
export const EXPERIMENTS = {
  LOGIN_BUTTON_STYLE: 'login_button_style_v1',
  ONBOARDING_FLOW: 'onboarding_flow_v1',
  FORM_VALIDATION: 'form_validation_v1'
} as const

// Initialize default experiments
export const initializeExperiments = () => {
  // Login button style experiment
  abTesting.registerExperiment({
    id: EXPERIMENTS.LOGIN_BUTTON_STYLE,
    name: 'Login Button Style Test',
    description: 'Test different login button styles for conversion',
    trafficAllocation: 0.5, // 50% of users
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'Control - Default Style',
        weight: 50,
        config: {
          buttonStyle: 'default',
          showIcon: true,
          buttonText: 'Googleでログイン'
        }
      },
      {
        id: 'minimal',
        name: 'Minimal Style',
        weight: 50,
        config: {
          buttonStyle: 'minimal',
          showIcon: false,
          buttonText: 'ログイン'
        }
      }
    ]
  })

  // Onboarding flow experiment
  abTesting.registerExperiment({
    id: EXPERIMENTS.ONBOARDING_FLOW,
    name: 'Onboarding Flow Test',
    description: 'Test different onboarding step progressions',
    trafficAllocation: 0.3, // 30% of users
    status: 'active',
    variants: [
      {
        id: 'standard',
        name: 'Standard 4-step flow',
        weight: 50,
        config: {
          stepCount: 4,
          allowSkip: true,
          progressIndicator: 'bar'
        }
      },
      {
        id: 'condensed',
        name: 'Condensed 2-step flow',
        weight: 50,
        config: {
          stepCount: 2,
          allowSkip: false,
          progressIndicator: 'dots'
        }
      }
    ]
  })
}