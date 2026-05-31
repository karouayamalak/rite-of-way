import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import storyImage from "@/assets/story-image.jpg";
import Newsletter from "@/components/Newsletter";

const About = () => {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="bg-secondary py-20 px-5 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-light tracking-[3px] mb-4"
        >
          OUR STORY
        </motion.h1>
        <p className="text-muted-foreground max-w-[500px] mx-auto">
          Crafted with intention, designed with purpose
        </p>
      </section>

      {/* Story */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
        <div
          className="min-h-[300px] md:min-h-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${storyImage})` }}
        />
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-10 md:p-20 flex flex-col justify-center"
        >
          <h2 className="text-2xl font-light tracking-[2px] mb-6">THE BEGINNING</h2>
          <p className="text-muted-foreground mb-5">
            Founded in Brooklyn, NY, Rite of Way was born from a deep belief that what we wear is
            an extension of who we are. Every piece tells a story of intentional design and
            conscious craftsmanship.
          </p>
          <p className="text-muted-foreground mb-5">
            Our journey began in 2019 with a simple mission: to create pieces that feel as good as
            they look, using ethically sourced materials and sustainable practices.
          </p>
          <p className="text-muted-foreground">
            Today, we continue to push boundaries while staying true to our roots — creating
            timeless pieces that connect you with your inner self and the world around you.
          </p>
        </motion.div>
      </section>

      {/* Values */}
      <section className="py-24 px-5 bg-secondary">
        <div className="max-w-[1000px] mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[2.2rem] font-light tracking-[2px] mb-16 text-center"
          >
            OUR VALUES
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Sustainability",
                text: "We use organic and recycled materials wherever possible, minimizing our environmental footprint.",
              },
              {
                title: "Community",
                text: "We believe in building connections. Our brand is more than products — it's a movement.",
              },
              {
                title: "Quality",
                text: "Every stitch, every fabric choice is made with longevity and comfort in mind.",
              },
            ].map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <h3 className="text-lg font-normal tracking-[1px] mb-4">{v.title}</h3>
                <p className="text-muted-foreground text-sm">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-[2.2rem] font-light tracking-[2px] mb-6">
            EXPLORE THE COLLECTION
          </h2>
          <p className="text-muted-foreground mb-8 max-w-[500px] mx-auto">
            Discover pieces that speak to your journey.
          </p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 bg-foreground text-background text-sm font-medium tracking-[1px] uppercase hover:bg-accent transition-colors duration-300 no-underline"
          >
            Shop Now
          </Link>
        </motion.div>
      </section>

      <Newsletter />
    </main>
  );
};

export default About;
