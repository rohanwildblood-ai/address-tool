// File: api/places.js

export default async function handler(req, res) {
  const { input } = req.query; // The raw address string from your voice agent (VAPI)

  if (!input) {
    return res.status(400).json({ error: 'No input provided' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  try {
    // Step 1: Call Places API with "Find Place from Text"
    const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      input
    )}&inputtype=textquery&fields=place_id,formatted_address,name,geometry&key=${apiKey}`;

    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (!placesData.candidates || placesData.candidates.length === 0) {
      return res.status(404).json({ error: 'No matching address found' });
    }

    // Pick the top candidate (Google sorts by confidence)
    const bestMatch = placesData.candidates[0];

    // Step 2: Use Geocoding API to get a normalized, complete address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${bestMatch.place_id}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    const normalized = geocodeData.results[0] || bestMatch;

    // Step 3: Return a clean result
    res.status(200).json({
      input, // the messy address from VAPI
      matched_address: normalized.formatted_address || bestMatch.formatted_address,
      location: normalized.geometry?.location || bestMatch.geometry?.location,
      place_id: bestMatch.place_id,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
