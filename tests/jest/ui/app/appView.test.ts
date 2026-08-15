import { useAppView } from '@ui/app/appView.ts'

describe('useAppView', () => {
  afterEach(() => {
    useAppView.setState({ view: 'onboarding' })
  })

  it('starts on the loading view', () => {
    expect(useAppView.getState().view).toBe('loading')
  })

  it('navigates to another view', () => {
    useAppView.getState().navigate('dashboard')
    expect(useAppView.getState().view).toBe('dashboard')
  })
})
