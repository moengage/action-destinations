import { Analytics, Context } from '@segment/analytics-next'
import adobeTarget, { destination } from '../../index'
import { Subscription } from '../../../../lib/browser-destinations'

/*
  TODO: Properly test the track() event in the following scenarios:
 - Track event without profile information attached.
 - Track event with visitor profile information attached.
 - Track event with registered user information attached.
*/
describe('Adobe Target Web', () => {
  test('calls identify', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'trackEvent',
        name: 'Track Event',
        enabled: true,
        subscribe: 'type = "track"',
        mapping: {}
      }
    ]
    const [event] = await adobeTarget({
      client_code: 'segmentexchangepartn',
      admin_number: '10',
      version: '2.8.0',
      cookie_domain: 'segment.com',
      mbox_name: 'target-global-mbox',
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const scripts = window.document.querySelectorAll('script')
    expect(scripts).toMatchInlineSnapshot(`
      NodeList [
        <script
          src="https://admin10.testandtarget.omniture.com/admin/rest/v1/libraries/atjs/download?client=segmentexchangepartn&version=2.8.0"
          status="loaded"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })
})
