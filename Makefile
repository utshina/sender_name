NAME=sender_name
VERSION=0.3

FILE=$(NAME)-$(VERSION)-tb.xpi

$(FILE): 
	zip -r $(FILE) install.rdf chrome.manifest chrome/ defaults/

