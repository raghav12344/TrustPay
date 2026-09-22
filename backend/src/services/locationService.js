const db = require("../config/database");

const resolveLocation = async (
    latitude,
    longitude
) => {
    if (
        latitude === undefined ||
        latitude === null ||
        longitude === undefined ||
        longitude === null
    ) {
        return null;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
    ) {
        throw new Error(
            "Invalid latitude or longitude"
        );
    }

    if (
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
    ) {
        throw new Error(
            "Latitude or longitude out of range"
        );
    }

    /*
     * Haversine distance.
     *
     * Calculates distance between the
     * browser's coordinates and every
     * known location in the database.
     */
    const [locations] = await db.query(
        `SELECT
            location_id,
            city,
            state,
            country,
            latitude,
            longitude,
            (
                6371 * ACOS(
                    LEAST(
                        1,
                        GREATEST(
                            -1,
                            COS(RADIANS(?))
                            * COS(RADIANS(latitude))
                            * COS(
                                RADIANS(longitude)
                                - RADIANS(?)
                            )
                            + SIN(RADIANS(?))
                            * SIN(RADIANS(latitude))
                        )
                    )
                )
            ) AS distance_km
         FROM locations
         WHERE latitude IS NOT NULL
         AND longitude IS NOT NULL
         ORDER BY distance_km ASC
         LIMIT 1`,
        [
            lat,
            lon,
            lat,
        ]
    );

    if (locations.length === 0) {
        return null;
    }

    const nearestLocation =
        locations[0];

    /*
     * Don't associate a user with a city
     * that is hundreds of kilometres away.
     *
     * 100 km is a reasonable demo threshold.
     */
    if (
        nearestLocation.distance_km > 100
    ) {
        return null;
    }

    return {
        locationId:
            nearestLocation.location_id,

        city:
            nearestLocation.city,

        state:
            nearestLocation.state,

        country:
            nearestLocation.country,

        distanceKm:
            Number(
                nearestLocation.distance_km
            ),
    };
};

module.exports = {
    resolveLocation,
};