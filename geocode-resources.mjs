import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "./drizzle/schema.ts";
import { eq, isNull } from "drizzle-orm";
import { makeRequest } from "./server/_core/map.ts";

const db = drizzle(process.env.DATABASE_URL);

async function geocodeAddress(address) {
  try {
    const response = await makeRequest("/maps/api/geocode/json", {
      address: address,
    });
    
    if (response.status === "OK" && response.results && response.results.length > 0) {
      const location = response.results[0].geometry.location;
      return {
        lat: location.lat.toString(),
        lng: location.lng.toString(),
      };
    }
    
    console.log(`  ⚠️  Geocoding failed for: ${address} (${response.status})`);
    return null;
  } catch (error) {
    console.error(`  ✗ Error geocoding ${address}:`, error.message);
    return null;
  }
}

async function geocodeAllResources() {
  console.log("Fetching resources without coordinates...\n");
  
  // Get all resources that don't have coordinates yet
  const resourcesWithoutCoords = await db
    .select()
    .from(resources)
    .where(isNull(resources.latitude));
  
  console.log(`Found ${resourcesWithoutCoords.length} resources to geocode\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const resource of resourcesWithoutCoords) {
    if (!resource.address) {
      console.log(`⊘ Skipping ${resource.name} (no address)`);
      failCount++;
      continue;
    }
    
    console.log(`Geocoding: ${resource.name}`);
    console.log(`  Address: ${resource.address}`);
    
    const coords = await geocodeAddress(resource.address);
    
    if (coords) {
      await db
        .update(resources)
        .set({
          latitude: coords.lat,
          longitude: coords.lng,
        })
        .where(eq(resources.id, resource.id));
      
      console.log(`  ✓ Success: ${coords.lat}, ${coords.lng}\n`);
      successCount++;
    } else {
      failCount++;
      console.log("");
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`Geocoding complete!`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log("=".repeat(50));
  
  process.exit(0);
}

geocodeAllResources();
