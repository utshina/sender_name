NAME=sender_name
VERSION=0.4

FILE=$(NAME)-$(VERSION)-tb.xpi

$(FILE): jar
	rm $(FILE)
	mkdir -p package/chrome
	cp install.rdf package/
	sed -e 's/chrome\//jar:chrome\/sender_name.jar\!\//' chrome.manifest > package/chrome.manifest
	cp chrome/sender_name.jar package/chrome/
	cp -r defaults package/
	cd package; zip -r ../$(FILE) install.rdf chrome.manifest chrome/sender_name.jar defaults/

jar:
	cd chrome; rm sender_name.jar; zip -r sender_name.jar content/ locale/ skin/

clean:
	rm -f $(FILE)
	rm -rf package/
