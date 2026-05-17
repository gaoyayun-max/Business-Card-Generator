import fs from 'fs';

const test = async () => {
    try {
        const formData = new FormData();
        formData.append("frontSvg", new Blob(['<svg></svg>'], {type: 'image/svg+xml'}), "front.svg");
        formData.append("backSvg", new Blob(['<svg></svg>'], {type: 'image/svg+xml'}), "back.svg");
        formData.append("name", "Test User");

        const res = await fetch('http://localhost:3000/api/submit-card', {
            method: 'POST',
            body: formData
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (err) {
        console.error("Fetch err:", err);
    }
}
test();
