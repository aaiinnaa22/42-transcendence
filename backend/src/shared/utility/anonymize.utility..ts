import { env } from "../../config/environment.js";
import crypto from "crypto";

const NOUNS: string[] = [
	"aardvark", "air", "airplane", "airport", "alarm", "alligator", "alphabet", "ambulance", "animal", "ankle",
	"bacon", "badge", "badger", "bag", "bagpipe", "bait", "bakery", "ball", "balloon", "bamboo", "banana", "band",
	"battery", "battle", "bay", "beach", "bead", "bean", "bear", "beard", "beast", "beat", "beauty", "beaver", "bed",
	"birthday", "bite", "black", "blade", "blanket", "block", "blood", "blouse", "blow", "board", "boat", "bobcat",
	"bow", "bowling", "box", "boy", "brain", "brake", "branch", "brass", "bread", "break", "breakfast", "breath",
	"bulldozer", "bumper", "bun", "bus", "bush", "butter", "button", "cabbage", "cactus", "cafe", "cake", "calculator",
	"card", "cardboard", "cardigan", "carpenter", "carrot", "cartoon", "cat", "caterpillar", "cathedral", "cattle",
	"chalk", "channel", "character", "cheek", "cheese", "cheetah", "cherry", "chess", "chest", "chick", "chicken",
	"cobweb", "cockroach", "cocoa", "coffee", "coil", "coin", "coke", "cold", "collar", "college", "colt", "comb",
	"cousin", "cow", "crab", "crack", "cracker", "crate", "crayfish", "crayon", "cream", "creek", "cricket",
	"cyclone", "dad", "daffodil", "daisy", "dance", "daughter", "day", "deer", "denim", "dentist", "desert", "desk",
	"dollar", "door", "dragon", "dragonfly", "drain", "drawer", "dream", "dress", "dresser", "drill", "drink", "drum",
	"elbow", "elephant", "energy", "engine", "equipment", "evening", "eye", "eyebrow", "face", "fact", "factory",
	"finger", "fire", "fireplace", "fish", "flag", "flame", "flood", "floor", "flower", "flute", "fly", "foam", "fog",
	"frost", "fruit", "fuel", "fur", "furniture", "game", "garage", "garden", "garlic", "gas", "gate", "gear", "ghost",
	"haircut", "hall", "hamburger", "hammer", "hamster", "hand", "handball", "handle", "hardware", "harmonica",
	"helicopter", "helmet", "hen", "hill", "hip", "hippo", "history", "hockey", "hole", "holiday",
	"icicle", "idea", "ink", "insect", "instrument", "Internet", "invention", "iron", "island", "jacket", "jaguar",
	"judo", "juice", "jump", "jumper", "kangaroo", "karate", "kayak", "kettle", "key", "keyboard", "kick", "kiss",
	"lasagna", "laugh", "laundry", "leaf", "leather", "leek", "leg", "lemonade", "leopard", "letter", "lettuce",
	"lizard", "loaf", "lobster", "lock", "locket", "locust", "look", "lotion", "love", "lunch", "lynx", "macaroni",
	"market", "mascara", "mask", "match", "meal", "meat", "mechanic", "medicine", "memory", "men", "menu", "message",
	"money", "monkey", "month", "moon", "morning", "mosquito", "motorboat", "motorcycle", "mountain", "mouse",
	"night", "noise", "noodle", "nose", "note", "notebook", "number", "nut", "oak", "oatmeal", "ocean", "octopus",
	"oyster", "packet", "page", "pail", "pain", "paint", "pair", "pajama", "pamphlet", "pan", "pancake", "panda",
	"patch", "path", "pea", "peace", "peanut", "pear", "pedestrian", "pelican", "pen", "pencil", "pepper", "perfume",
	"pimple", "pin", "pipe", "pizza", "plane", "plant", "plantation", "plastic", "plate", "playground", "plot",
	"postbox", "pot", "potato", "poultry", "powder", "power", "price", "printer", "prison", "pumpkin", "puppy",
	"railway", "rain", "rainbow", "raincoat", "rainstorm", "rake", "rat", "ravioli", "ray", "recorder", "rectangle",
	"road", "roast", "rock", "roll", "roof", "room", "rooster", "rose", "rowboat", "rubber", "sack", "sail",
	"saxophone", "scarecrow", "scarf", "school", "scissors", "scooter", "scorpion", "screw", "screwdriver", "sea",
	"shadow", "shallot", "shampoo", "shark", "shears", "sheep", "sheet", "shelf", "shell", "shield", "ship", "shirt",
	"silk", "silver", "singer", "sink", "sister", "skin", "skirt", "sky", "sled", "slippers", "slope", "smoke",
	"snail", "snake", "sneeze", "snow", "snowflake", "snowman", "soap", "soccer", "sock", "sofa", "softball",
	"speedboat", "spider", "spike", "spinach", "sponge", "spoon", "spot", "sprout", "spy", "square", "squash", "squid",
	"stitch", "stinger", "stomach", "stone", "stool", "stopsign", "stopwatch", "store", "storm", "story", "stove",
	"supermarket", "surfboard", "surname", "surprise", "sushi", "swallow", "swamp", "swan", "sweater", "sweatshirt",
	"tax", "taxi", "tea", "teacher", "team", "teeth", "television", "tennis", "tent", "textbook", "theater", "thistle",
	"time", "tire", "toad", "toast", "toe", "toilet", "tomato", "tongue", "tooth", "toothbrush", "toothpaste", "top",
	"triangle", "trick", "trip", "trombone", "trouble", "trousers", "truck", "trumpet", "trunk", "tub",
	"valley", "van", "vase", "vegetable", "veil", "vein", "vessel", "vest", "violin", "volcano", "volleyball",
	"wave", "wax", "weapon", "weasel", "weather", "wedge", "whale", "wheel", "whip", "whistle", "wilderness", "willow"
];

export const pseudonym = ( uuid: string ): string =>
{
	const buffer = crypto.createHmac( "sha256", env.LOG_SECRET ).update( uuid ).digest( );

	const indexA = buffer.readUint32BE( 8 ) % NOUNS.length;
	const indexB = buffer.readUint32BE( 4 ) % NOUNS.length;

	return `${NOUNS[indexA]}-${NOUNS[indexB]}`;
};
