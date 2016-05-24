import {ComponentRegistry} from 'nylas-exports'
import StressTestSection from './stress-test-section'
import StressTestButton from './stress-test-button'

/**
 * This expects that you have a file at `~/.credentials/gmail-token.json`
 * with an `access_token`, `token_type`, `refresh_token`, and
 * `expiry_date` fields. Use https://developers.google.com/oauthplayground
 * to get a token.
 */
export function activate() {
  ComponentRegistry.register(StressTestButton, {location: "DeveloperBar:Header"})
  ComponentRegistry.register(StressTestSection, {location: "DeveloperBar:Center:StressTest"})
}

export function serialize() {
}

export function deactivate() {
  ComponentRegistry.unregister(StressTestButton)
  ComponentRegistry.unregister(StressTestSection)
}
