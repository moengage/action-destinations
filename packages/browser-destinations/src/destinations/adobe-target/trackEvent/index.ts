import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Adobe } from '../types'

const action: BrowserActionDefinition<Settings, Adobe, Payload> = {
  title: 'Track Event',
  description: 'Track an event',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  // TODO add event type as parameter
  fields: {
    type: {
      label: 'Event Name',
      description: 'Event type or name.',
      type: 'string',
      default: {
        '@path': '@.type'
      }
    },
    properties: {
      label: 'Event Parameters',
      description: 'Parameters specific to the event.',
      type: 'object',
      default: {
        '@path': '@.properties'
      }
    }
  },
  perform: (Adobe, event) => {
    // Target Docs on Track Event:
    // https://experienceleague.adobe.com/docs/target/using/implement-target/client-side/at-js-implementation/functions-overview/adobe-target-trackevent.html?lang=en

    // TODO: Test track() calls

    const event_params = {
      ...event.payload.properties,
      event_name: event.payload.type
    }

    const params = {
      mbox: event.settings.mbox_name,
      preventDefault: true,
      params: event_params,
      type: 'click'
    }

    Adobe.target.trackEvent(params)
  }
}

export default action
