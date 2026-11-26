export function buildSnippet(trackingId: string): string {
  return `<script>
  (function () {
    var id = localStorage.getItem('pulse_vid');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('pulse_vid', id); }
    fetch('https://YOUR_HOST/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: '${trackingId}',
        name: 'pageview',
        visitorId: id,
        eventId: crypto.randomUUID(),
        url: window.location.href,
        referrer: document.referrer,
        device: { type: window.innerWidth < 768 ? 'mobile' : 'desktop' }
      })
    });
  })();
</script>`;
}
