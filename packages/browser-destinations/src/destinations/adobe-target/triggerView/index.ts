import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Adobe } from '../types'

const action: BrowserActionDefinition<Settings, Adobe, Payload> = {
  title: 'Trigger View',
  description: 'Record a view',
  platform: 'web',
  fields: {
    viewName: {
      type: 'string',
      description: 'Name of thew view or page.',
      label: 'View Name',
      default: {
        '@path': '$.name' // TODO: Check if this is the right way to grab page information
      },
      required: true
    },
    pageParameters: {
      type: 'object',
      description: 'Parameters specific to the view or page.',
      label: 'Page Parameters',
      default: {
        '@path': '$.properties' // TODO: Why properties and not traits?
      }
    },
    sendNotification: {
      type: 'boolean',
      description:
        'By default, notifications are sent to the Adobe Target backend for incrementing impression count.  If false, notifications are not sent for incrementing impression count. ',
      label: 'Send Notifications to Adobe Target.',
      default: true
    }
  },
  perform: (Adobe, event) => {
    const pageName = event.payload.viewName
    const sendNotification = event.payload.sendNotification
    const pageParams = event.payload.pageParameters

    Adobe.target.triggerView(pageName, { page: sendNotification, ...pageParams })
  }
}

export default action
