import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import { HEAP_SEGMENT_CLOUD_LIBRARY_NAME } from '../constants'
import { flat } from '../flat'
import { getUserIdentifier, getEventName, isDefined } from '../heapUtils'
import { IntegrationError } from '@segment/actions-core'

type HeapEvent = {
  event: string | undefined
  idempotency_key: string
  timestamp?: string
  custom_properties: {
    [k: string]: unknown
  }
  user_identifier?: {
    [k: string]: string
  }
}

type IntegrationsTrackPayload = {
  app_id: string
  events: Array<HeapEvent>
  library: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send an event to Heap.',
  defaultSubscription: 'type = "track" or type = "page" or type = "screen"',
  fields: {
    message_id: {
      label: 'Message ID',
      type: 'string',
      description: 'Unique event ID generated by Segment.',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    identity: {
      label: 'Identity',
      type: 'string',
      allowNull: true,
      description:
        'a string that uniquely identifies a user, such as an email, handle, or username. This means no two users in one environment may share the same identity. More on identify: https://developers.heap.io/docs/using-identify'
    },
    anonymous_id: {
      label: 'Anonymous ID',
      type: 'string',
      allowNull: true,
      description: 'The generated anonymous ID for the user.',
      default: {
        '@path': '$.anonymousId'
      }
    },
    event: {
      label: 'Track Event Type',
      type: 'string',
      description: 'Name of the user action. This only exists on track events. Limited to 1024 characters.',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      label: 'Event Properties',
      type: 'object',
      description:
        'An object with key-value properties you want associated with the event. Each key and property must either be a number or string with fewer than 1024 characters.',
      default: {
        '@path': '$.properties'
      }
    },
    timestamp: {
      label: 'Timestamp',
      type: 'datetime',
      description: 'Defaults to the current time if not provided.',
      default: {
        '@path': '$.timestamp'
      }
    },
    type: {
      label: 'Type',
      type: 'string',
      description: 'The type of call. Can be track, page, or screen.',
      default: {
        '@path': '$.type'
      }
    },
    name: {
      label: 'Page or Screen Name',
      type: 'string',
      description: 'The name of the page or screen being viewed. This only exists for page and screen events.',
      default: {
        '@path': '$.name'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description:
        'An object with key-value properties you want associated with the user. Each property must either be a number or string with fewer than 1024 characters.',
      default: {
        '@path': '$.context.traits'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const requests = []

    if (!payload.anonymous_id && !payload.identity) {
      throw new IntegrationError('Either Anonymous id or Identity should be specified.', 'MISSING_REQUIRED_FIELD', 400)
    }

    const flattenedProperties = flat(payload.properties || {})

    const event: HeapEvent = {
      event: getEventName(payload),
      custom_properties: {
        segment_library: HEAP_SEGMENT_CLOUD_LIBRARY_NAME,
        ...flattenedProperties,
        ...(isDefined(payload.name) && { name: payload.name })
      },
      idempotency_key: payload.message_id
    }

    event.user_identifier = getUserIdentifier({ identity: payload.identity, anonymous_id: payload.anonymous_id })

    if (payload.timestamp && dayjs.utc(payload.timestamp).isValid()) {
      event.timestamp = dayjs.utc(payload.timestamp).toISOString()
    }

    const trackPayload: IntegrationsTrackPayload = {
      app_id: settings.appId,
      events: [event],
      library: 'server'
    }

    if (isDefined(payload.identity) && (isDefined(payload.anonymous_id) || isDefined(payload.traits))) {
      const userPropertiesPayload = {
        app_id: settings.appId,
        identity: payload.identity,
        properties: {
          ...(isDefined(payload.anonymous_id) && { anonymous_id: payload.anonymous_id }),
          ...(payload.traits && Object.keys(payload.traits).length !== 0 && flat(payload.traits))
        }
      }
      const addUserPropertiesRequest = request('https://heapanalytics.com/api/add_user_properties', {
        method: 'post',
        json: userPropertiesPayload
      })

      requests.push(addUserPropertiesRequest)
    }

    requests.push(
      request('https://heapanalytics.com/api/integrations/track', {
        method: 'post',
        json: trackPayload
      })
    )

    return Promise.all(requests)
  }
}

export default action